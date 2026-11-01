/**
 * Shopify Admin API client (server only, read-only app).
 * Values come from the host's environment variables, never from the repo:
 * SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET.
 */
import { requireUser } from "@/lib/session";

export const API_VERSION = "2026-10";

type Token = { value: string; expires: number };
let token: Token | null = null;

export function isShopifyConnected() {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET,
  );
}

async function accessToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID ?? "",
      client_secret: process.env.SHOPIFY_CLIENT_SECRET ?? "",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify token request failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in?: number };
  token = { value: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return token.value;
}

export type ShopifyResult<T> = { data: T | null; errors: string[] };

/** Runs a read query for a signed-in person. Returns partial data with error messages (e.g. a field the app may not read). */
export async function shopifyQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<ShopifyResult<T>> {
  await requireUser();
  return shopifyAdmin<T>(query, variables);
}

/**
 * The same query without the sign-in check, for cached code ("use cache" cannot read the session) and the daily job.
 * Callers must check the person first (requireUser) or be the cron route.
 */
export async function shopifyAdmin<T>(query: string, variables: Record<string, unknown> = {}): Promise<ShopifyResult<T>> {
  let tokenValue: string;
  try {
    tokenValue = await accessToken();
  } catch (error) {
    return { data: null, errors: [error instanceof Error ? error.message : "Shopify sign-in failed"] };
  }
  // Shopify limits GraphQL by query cost (a bucket that refills each second). When it answers THROTTLED or 429,
  // wait as long as its own figures say, then try again; give up after 3 tries so a page never hangs.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-shopify-access-token": tokenValue },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    const retryable = res.status === 429 || res.status === 502 || res.status === 503;
    if (!res.ok && !retryable) return { data: null, errors: [`Shopify request failed (${res.status})`] };
    const body = retryable ? null : ((await res.json()) as GraphQLBody<T>);
    const throttled = retryable || Boolean(body?.errors?.some((e) => e.extensions?.code === "THROTTLED"));
    if (!throttled || attempt >= MAX_ATTEMPTS) {
      if (!body) return { data: null, errors: [`Shopify is busy (${res.status}); try again in a moment`] };
      return { data: body.data ?? null, errors: (body.errors ?? []).map((e) => e.message) };
    }
    await sleep(waitMs(res, body));
  }
}

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GraphQLBody<T> = {
  data?: T;
  errors?: { message: string; extensions?: { code?: string } }[];
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      throttleStatus: { currentlyAvailable: number; restoreRate: number };
    };
  };
};

/** How long to wait before retrying: Retry-After if sent, else the time the cost bucket needs to refill (0.5–5 s). */
function waitMs(res: Response, body: GraphQLBody<unknown> | null) {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (retryAfter > 0) return Math.min(retryAfter * 1000, 5000);
  const cost = body?.extensions?.cost;
  if (cost && cost.throttleStatus.restoreRate > 0) {
    const missing = cost.requestedQueryCost - cost.throttleStatus.currentlyAvailable;
    return Math.min(Math.max((missing / cost.throttleStatus.restoreRate) * 1000, 500), 5000);
  }
  return 1000;
}

/**
 * Shopify Admin API client (server only, read-only app).
 * Values come from the host's environment variables, never from the repo:
 * SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET.
 */
import { requireUser } from "@/lib/session";

const API_VERSION = "2026-10";

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

/** Runs a read query. Returns partial data with error messages (e.g. a field the app may not read). */
export async function shopifyQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<ShopifyResult<T>> {
  await requireUser();
  let tokenValue: string;
  try {
    tokenValue = await accessToken();
  } catch (error) {
    return { data: null, errors: [error instanceof Error ? error.message : "Shopify sign-in failed"] };
  }
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": tokenValue },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) return { data: null, errors: [`Shopify request failed (${res.status})`] };
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  return { data: body.data ?? null, errors: (body.errors ?? []).map((e) => e.message) };
}

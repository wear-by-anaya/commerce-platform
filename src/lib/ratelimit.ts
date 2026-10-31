import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Limits per signed-in person. Kept in the database, so they hold across every server instance. */
export const LIMITS = {
  save: { max: 60, seconds: 60 }, // forms: invoices, costs, expenses, review ticks
  upload: { max: 10, seconds: 600 }, // product cost sheet uploads
  download: { max: 30, seconds: 3600 }, // sheet downloads (each reads Shopify)
} as const;

export class RateLimitError extends Error {
  constructor(public readonly retryInSeconds: number) {
    super(`Too many requests. Try again in ${retryInSeconds} seconds.`);
  }
}

/**
 * Counts one hit for this person and action in a fixed time window; throws RateLimitError over the limit.
 * Old windows are cleared now and then, so the table stays small.
 */
export async function rateLimit(kind: keyof typeof LIMITS, who: string) {
  const { max, seconds } = LIMITS[kind];
  const sql = await db();
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (seconds * 1000)) * seconds * 1000).toISOString();
  const rows = await sql`INSERT INTO rate_limits (bucket, window_start, hits) VALUES (${`${kind}:${who}`}, ${windowStart}, 1)
    ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
    RETURNING hits`;
  if (Math.random() < 0.02) await sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`;
  if (Number(rows[0]?.hits ?? 0) > max) {
    const windowEnd = Date.parse(windowStart) + seconds * 1000;
    throw new RateLimitError(Math.max(1, Math.ceil((windowEnd - now) / 1000)));
  }
}

/** Sign-in check plus limit for one action. Returns a message for the person when over the limit, else null. */
export async function limitFor(kind: keyof typeof LIMITS): Promise<string | null> {
  const user = await requireUser();
  try {
    await rateLimit(kind, user.email ?? "unknown");
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) return error.message;
    throw error;
  }
}

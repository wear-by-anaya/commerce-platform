import { timingSafeEqual } from "node:crypto";
import { logEvent } from "@/lib/audit";
import { isDatabaseConnected } from "@/lib/db";
import { rateLimit, RateLimitError } from "@/lib/ratelimit";
import { isKind, isStatus } from "@/lib/run-kinds";
import { saveRun } from "@/lib/sync-runs";

// Our job scripts (imports, Unstitched batches, New Arrivals rebuilds) report each run here.
// They send "Authorization: Bearer <SYNC_TOKEN>"; without SYNC_TOKEN set in Vercel nothing is accepted.
// Body (JSON): { kind, name, status, items, errors, detail?, startedAt?, finishedAt? }

const sameSecret = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

const isTime = (value: unknown) => typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));

export async function POST(request: Request) {
  const secret = process.env.SYNC_TOKEN;
  if (!secret || !sameSecret(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new Response("Not allowed", { status: 401 });
  }
  if (!isDatabaseConnected()) return new Response("Database is not connected", { status: 503 });
  try {
    await rateLimit("save", "sync-api");
  } catch (error) {
    if (error instanceof RateLimitError) return new Response(error.message, { status: 429 });
    throw error;
  }
  const text = await request.text();
  if (text.length > 10_000) return new Response("Too big", { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response("Send JSON", { status: 400 });
  }
  const kind = String(body.kind ?? "");
  const status = String(body.status ?? "");
  const name = String(body.name ?? "").trim();
  const items = Number(body.items ?? 0);
  const errors = Number(body.errors ?? 0);
  if (!isKind(kind) || !isStatus(status) || !name || !Number.isFinite(items) || !Number.isFinite(errors)) {
    return new Response("Need kind, name, status, items and errors", { status: 400 });
  }
  if ((body.startedAt && !isTime(body.startedAt)) || (body.finishedAt && !isTime(body.finishedAt))) {
    return new Response("startedAt / finishedAt must be dates", { status: 400 });
  }
  const id = await saveRun({
    kind,
    name,
    status,
    items,
    errors,
    detail: typeof body.detail === "string" ? body.detail : "",
    source: "script",
    loggedBy: "job script",
    startedAt: (body.startedAt as string) || null,
    finishedAt: (body.finishedAt as string) || null,
  });
  await logEvent("job script", "sync run logged", `${kind}: ${name.slice(0, 120)}`);
  return Response.json({ id });
}

import { revalidateTag } from "next/cache";
import { DESIGNERS_TAG, oldestBrands, scanBrand } from "@/lib/designers";
import { saveRun } from "@/lib/sync-runs";

// Daily job (vercel.json): checks the 12 brands checked longest ago, so all brands rotate within a week.
// Vercel sends "Authorization: Bearer <CRON_SECRET>"; without CRON_SECRET set in Vercel the job does nothing.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not allowed", { status: 401 });
  }
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const done: string[] = [];
  const failed: string[] = [];
  for (const brand of await oldestBrands(12)) {
    if (Date.now() - started > 250_000) break;
    const r = await scanBrand(brand);
    done.push(`${brand.slug}: ${r.ok ? `${r.products} products, ${r.inStock} in stock` : r.error}`);
    if (!r.ok) failed.push(`${brand.name}: ${r.error}`);
  }
  // One line on the Sync runs page per daily check.
  await saveRun({
    kind: "brand-check",
    name: "Daily brand check",
    status: failed.length === 0 ? "ok" : failed.length === done.length ? "failed" : "partial",
    items: done.length - failed.length,
    errors: failed.length,
    detail: failed.join("\n"),
    source: "cron",
    loggedBy: "daily job",
    startedAt,
  }).catch(() => {});
  revalidateTag(DESIGNERS_TAG, "max");
  return Response.json({ checked: done.length, done });
}

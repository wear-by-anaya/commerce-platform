import { revalidateTag } from "next/cache";
import { DESIGNERS_TAG, oldestBrands, scanBrand } from "@/lib/designers";

// Daily job (vercel.json): checks the 12 brands checked longest ago, so all brands rotate within a week.
// Vercel sends "Authorization: Bearer <CRON_SECRET>"; without CRON_SECRET set in Vercel the job does nothing.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not allowed", { status: 401 });
  }
  const started = Date.now();
  const done: string[] = [];
  for (const brand of await oldestBrands(12)) {
    if (Date.now() - started > 250_000) break;
    const r = await scanBrand(brand);
    done.push(`${brand.slug}: ${r.ok ? `${r.products} products, ${r.inStock} in stock` : r.error}`);
  }
  revalidateTag(DESIGNERS_TAG, "max");
  return Response.json({ checked: done.length, done });
}

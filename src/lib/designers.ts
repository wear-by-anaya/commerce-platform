import { BRANDS, vendorsOf, type Brand } from "@/lib/brands";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { shopifyQuery } from "@/lib/shopify/client";

/** A brand needs a new check of its website after this many days (weekly rule, 29 Oct). */
export const RECHECK_DAYS = 7;

type BrandProduct = { published_at?: string; created_at?: string; variants: { available: boolean }[] };

/**
 * Reads a brand's public Shopify catalogue (products.json, 250 per page) and counts pieces in and out of stock.
 * Waits and retries when the brand's site says "too many requests". Stops after `budgetMs` so a page never hangs.
 */
async function readCatalogue(site: string, budgetMs: number) {
  const started = Date.now();
  let products = 0;
  let inStock = 0;
  let newest = "";
  for (let page = 1; page <= 60; page++) {
    if (Date.now() - started > budgetMs) throw new Error("took too long; try again");
    let res: Response | null = null;
    for (let tries = 0; tries < 3; tries++) {
      res = await fetch(`${site}/products.json?limit=250&page=${page}`, {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (stock check)" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (res.status !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (tries + 1)));
    }
    if (!res || !res.ok) throw new Error(`site answered ${res?.status ?? "nothing"}`);
    const body = (await res.json()) as { products?: BrandProduct[] };
    const list = body.products ?? [];
    if (!list.length) break;
    products += list.length;
    for (const p of list) {
      if (p.variants.some((v) => v.available)) inStock++;
      const when = p.published_at ?? p.created_at ?? "";
      if (when > newest) newest = when;
    }
    if (list.length < 250) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return { products, inStock, newest: newest || null };
}

/** Checks one brand's website and saves the result (or the error). */
export async function scanBrand(brand: Brand, budgetMs = 45_000) {
  const sql = await db();
  try {
    const r = await readCatalogue(brand.site, budgetMs);
    await sql`INSERT INTO brand_scans (slug, checked_at, products, in_stock, newest_at, error)
      VALUES (${brand.slug}, now(), ${r.products}, ${r.inStock}, ${r.newest}, '')
      ON CONFLICT (slug) DO UPDATE SET checked_at = now(), products = EXCLUDED.products, in_stock = EXCLUDED.in_stock,
        newest_at = EXCLUDED.newest_at, error = ''`;
    return { ok: true as const, ...r };
  } catch (error) {
    const message = error instanceof Error ? error.message : "check failed";
    await sql`INSERT INTO brand_scans (slug, checked_at, error) VALUES (${brand.slug}, now(), ${message})
      ON CONFLICT (slug) DO UPDATE SET checked_at = now(), error = EXCLUDED.error`;
    return { ok: false as const, error: message };
  }
}

/** The brands checked longest ago (never-checked first): used by the daily job and the "Check oldest" button. */
export async function oldestBrands(count: number) {
  const sql = await db();
  const rows = await sql`SELECT slug, checked_at FROM brand_scans`;
  const checked = new Map(rows.map((r) => [String(r.slug), Date.parse(String(r.checked_at))]));
  return [...BRANDS].sort((a, b) => (checked.get(a.slug) ?? 0) - (checked.get(b.slug) ?? 0)).slice(0, count);
}

/** Shopify caps counts at 10,000 unless limit is null. How many active products each Shopify vendor has in this store (20 counts per query to stay under Shopify's cost limit). */
async function storeCounts(vendors: string[]) {
  const counts = new Map<string, number>();
  for (let i = 0; i < vendors.length; i += 20) {
    const chunk = vendors.slice(i, i + 20);
    const fields = chunk
      .map((v, j) => `v${j}: productsCount(query: ${JSON.stringify(`vendor:"${v.replace(/"/g, "")}" AND status:active`)}, limit: null) { count }`)
      .join("\n");
    const { data } = await shopifyQuery<Record<string, { count: number }>>(`{ ${fields} }`);
    chunk.forEach((v, j) => counts.set(v, data?.[`v${j}`]?.count ?? 0));
  }
  return counts;
}

export type DesignerRow = {
  slug: string;
  name: string;
  site: string;
  partner: boolean;
  ourProducts: number;
  brandProducts: number | null;
  brandInStock: number | null;
  newestAt: string | null;
  checkedAt: string | null;
  daysSince: number | null;
  needsRecheck: boolean;
  error: string;
};

export async function designers(): Promise<{ rows: DesignerRow[]; storeTotal: number; storeBrands: number }> {
  await requireUser();
  const sql = await db();
  const [scans, partners, vendorList, total] = await Promise.all([
    sql`SELECT slug, products, in_stock, newest_at::text AS newest_at, checked_at::text AS checked_at, error,
        EXTRACT(EPOCH FROM (now() - checked_at)) / 86400 AS days FROM brand_scans`,
    sql`SELECT slug FROM brand_partners`,
    shopifyQuery<{ productVendors: { nodes: string[] } }>(`{ productVendors(first: 250) { nodes } }`),
    shopifyQuery<{ productsCount: { count: number } }>(`{ productsCount(query: "status:active", limit: null) { count } }`),
  ]);
  const scan = new Map(scans.map((r) => [String(r.slug), r]));
  const partner = new Set(partners.map((r) => String(r.slug)));
  const counts = await storeCounts(BRANDS.flatMap(vendorsOf));
  const rows = BRANDS.map((b) => {
    const s = scan.get(b.slug);
    const days = s ? Number(s.days) : null;
    return {
      slug: b.slug,
      name: b.name,
      site: b.site,
      partner: partner.has(b.slug),
      ourProducts: vendorsOf(b).reduce((sum, v) => sum + (counts.get(v) ?? 0), 0),
      brandProducts: s && !s.error ? Number(s.products) : null,
      brandInStock: s && !s.error ? Number(s.in_stock) : null,
      newestAt: s?.newest_at ? String(s.newest_at) : null,
      checkedAt: s ? String(s.checked_at) : null,
      daysSince: days,
      needsRecheck: days === null || days >= RECHECK_DAYS || Boolean(s?.error),
      error: s ? String(s.error) : "",
    };
  });
  return {
    rows,
    storeTotal: total.data?.productsCount.count ?? 0,
    storeBrands: vendorList.data?.productVendors.nodes.length ?? 0,
  };
}

export async function setPartner(slug: string, partner: boolean) {
  await requireUser();
  if (!BRANDS.some((b) => b.slug === slug)) return;
  const sql = await db();
  if (partner) await sql`INSERT INTO brand_partners (slug) VALUES (${slug}) ON CONFLICT DO NOTHING`;
  else await sql`DELETE FROM brand_partners WHERE slug = ${slug}`;
}

import { cacheLife } from "next/cache";
import { requireUser } from "@/lib/session";
import { API_VERSION, shopifyQuery } from "@/lib/shopify/client";

/** Official sources only (project rule: confirm on the source before acting). */
const SOURCES = [
  { id: "shopify-merchant", name: "Shopify changelog", url: "https://changelog.shopify.com/feed.xml" },
  { id: "shopify-dev", name: "Shopify platform (developers)", url: "https://shopify.dev/changelog/feed.xml" },
  { id: "google-search", name: "Google Search Central blog", url: "https://developers.google.com/search/blog/feed.xml" },
  { id: "google-status", name: "Google Search status (core and spam updates)", url: "https://status.search.google.com/en/feed.atom" },
] as const;

/** Words that make an item worth reading for these two stores. */
const RELEVANT =
  /checkout|payment|shopify payments|market|currenc|merchant center|merchant listing|shopping|product|variant|structured data|core update|spam update|ranking|search console|theme|liquid|seo|sitemap|robots|ai mode|agentic|catalog|deprecat|unsupported|api version|order|shipping|tax|returns?/i;

export type UpdateItem = {
  source: string;
  title: string;
  link: string;
  date: string; // ISO
  isNew: boolean;
  relevant: boolean;
};

const decode = (text: string) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .trim();

const tag = (block: string, name: string) => block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "";

/** Reads RSS <item> and Atom <entry> blocks; keeps only http(s) links. */
function parseFeed(xml: string, source: string): Omit<UpdateItem, "isNew">[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];
  return blocks.map((block) => {
    const title = decode(tag(block, "title"));
    const rawLink = decode(tag(block, "link")) || block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const link = /^https?:\/\//.test(rawLink) ? rawLink : "";
    const when = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
    const time = Date.parse(decode(when));
    return { source, title, link, date: Number.isNaN(time) ? "" : new Date(time).toISOString(), relevant: RELEVANT.test(title) };
  });
}

/** One feed, parsed. Cached for an hour; a failed read throws and is not cached. */
async function readFeed(url: string, name: string) {
  "use cache";
  cacheLife("hours");
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(String(res.status));
  return parseFeed(await res.text(), name);
}

export async function platformUpdates(days = 30) {
  await requireUser();
  const now = Date.now();
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      try {
        return { name: src.name, items: await readFeed(src.url, src.name), failed: false };
      } catch {
        return { name: src.name, items: [], failed: true };
      }
    }),
  );
  const items: UpdateItem[] = results
    .flatMap((r) => r.items)
    .filter((item) => item.title && item.date && now - Date.parse(item.date) <= days * 86_400_000)
    .map((item) => ({ ...item, isNew: now - Date.parse(item.date) <= 7 * 86_400_000 }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { items, failed: results.filter((r) => r.failed).map((r) => r.name) };
}

type ApiVersion = { handle: string; supported: boolean };

/** Is the Shopify API version this dashboard uses still supported, and is a newer one out? */
export async function apiVersionStatus() {
  const { data } = await shopifyQuery<{ publicApiVersions: ApiVersion[] }>(`{ publicApiVersions { handle supported } }`);
  const versions = data?.publicApiVersions ?? [];
  const ours = versions.find((v) => v.handle === API_VERSION);
  const newest = versions.filter((v) => v.supported && /^\d{4}-\d{2}$/.test(v.handle)).map((v) => v.handle).sort().pop();
  return { ours: API_VERSION, supported: ours?.supported ?? null, newest: newest ?? null };
}

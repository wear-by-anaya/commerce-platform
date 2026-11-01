import { BRANDS } from "@/lib/brands";
import { db, isDatabaseConnected } from "@/lib/db";
import { kindLabel } from "@/lib/run-kinds";
import { requireUser } from "@/lib/session";
import { failedRuns } from "@/lib/sync-runs";
import { platformUpdates, updateKey, updateReviews } from "@/lib/updates";

/**
 * Reviews: one list of things that need a person.
 * - New brand stock: a brand put new pieces on its own site in the last 14 days (from the brand checks).
 * - Brand check problems: a brand's site could not be read; the daily check has not run for 36 hours; brands unchecked for 9+ days.
 * - Failed jobs: sync runs that failed or finished with errors in the last 30 days.
 * - Updates: Shopify and Google news that matters to us and is not ticked as reviewed yet.
 * Alerts that only a person can settle (new stock, failed jobs) get "Mark done"; the others clear themselves.
 */

export const NEW_STOCK_DAYS = 14;

export type AlertGroup = "stock" | "jobs" | "updates";
export type Alert = {
  key: string;
  group: AlertGroup;
  tone: "neutral" | "accent" | "warning";
  title: string;
  detail: string;
  href: string;
  hrefLabel: string;
  external?: boolean;
  at: string | null;
  /** Can be marked done by a person; otherwise it clears itself when fixed. */
  dismissable: boolean;
  done?: { by: string; at: string };
};

const brandName = (slug: string) => BRANDS.find((b) => b.slug === slug)?.name ?? slug;
const brandSite = (slug: string) => BRANDS.find((b) => b.slug === slug)?.site ?? "";
const day = (iso: string) => iso.slice(0, 10);

export async function reviewAlerts(): Promise<{ open: Alert[]; done: Alert[] }> {
  await requireUser();
  if (!isDatabaseConnected()) return { open: [], done: [] };
  const sql = await db();
  const [fresh, errors, health, failed, doneRows, partners, updates, reviews] = await Promise.all([
    sql`SELECT slug, newest_at::text AS newest_at, in_stock FROM brand_scans
      WHERE error = '' AND newest_at > now() - make_interval(days => ${NEW_STOCK_DAYS}) ORDER BY newest_at DESC`,
    sql`SELECT slug, error, checked_at::text AS checked_at FROM brand_scans WHERE error <> '' ORDER BY checked_at DESC`,
    sql`SELECT max(checked_at)::text AS last, COALESCE(bool_or(checked_at > now() - interval '36 hours'), false) AS ran,
        count(*) FILTER (WHERE checked_at < now() - interval '9 days')::int AS stale, count(*)::int AS checked FROM brand_scans`,
    failedRuns(),
    sql`SELECT alert_key, done_by, done_at::text AS done_at FROM alert_reviews WHERE done_at > now() - interval '60 days'`,
    sql`SELECT slug FROM brand_partners`,
    platformUpdates(30).catch(() => ({ items: [], failed: [] as string[] })),
    updateReviews(),
  ]);
  const doneMap = new Map(doneRows.map((r) => [String(r.alert_key), { by: String(r.done_by), at: String(r.done_at) }]));
  const partner = new Set(partners.map((r) => String(r.slug)));
  const alerts: Alert[] = [];

  for (const r of fresh) {
    const slug = String(r.slug);
    const newest = String(r.newest_at);
    alerts.push({
      key: `new-stock:${slug}:${day(newest)}`,
      group: "stock",
      tone: "accent",
      title: `${brandName(slug)} added new pieces${partner.has(slug) ? " (partner)" : ""}`,
      detail: `Newest piece on their site: ${new Date(newest).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}. ${Number(r.in_stock).toLocaleString("en-GB")} pieces in stock there. Check what we do not have yet and add it to both stores.`,
      href: brandSite(slug),
      hrefLabel: "Open their site",
      external: true,
      at: newest,
      dismissable: true,
    });
  }

  const h = health[0];
  if (Number(h?.checked ?? 0) > 0 && !h?.ran) {
    alerts.push({
      key: "brand-check-missed",
      group: "jobs",
      tone: "warning",
      title: "The daily brand check has not run for over 36 hours",
      detail: "It runs at 3 am Pakistan time (Vercel cron). Check Vercel > Settings > Cron Jobs, or press Check oldest on Designers.",
      href: "/designers",
      hrefLabel: "Designers",
      at: h?.last ? String(h.last) : null,
      dismissable: false,
    });
  }
  if (Number(h?.stale ?? 0) > 0) {
    alerts.push({
      key: "brand-check-stale",
      group: "stock",
      tone: "neutral",
      title: `${h.stale} ${Number(h.stale) === 1 ? "brand has" : "brands have"} not been checked for 9 days or more`,
      detail: "The daily check does the 12 oldest each night; brands whose site failed stay behind. Check them on Designers.",
      href: "/designers",
      hrefLabel: "Designers",
      at: null,
      dismissable: false,
    });
  }
  for (const r of errors) {
    const slug = String(r.slug);
    alerts.push({
      key: `brand-error:${slug}`,
      group: "stock",
      tone: "warning",
      title: `${brandName(slug)}: their site could not be read`,
      detail: `${String(r.error)}. Clears itself after the next good check.`,
      href: "/designers",
      hrefLabel: "Check again on Designers",
      at: String(r.checked_at),
      dismissable: false,
    });
  }

  for (const run of failed) {
    alerts.push({
      key: `run:${run.id}`,
      group: "jobs",
      tone: "warning",
      title: `${kindLabel(run.kind)} ${run.status === "failed" ? "failed" : "finished with errors"}: ${run.name}`,
      detail: `${run.items.toLocaleString("en-GB")} done, ${run.errors.toLocaleString("en-GB")} errors.${run.detail ? ` ${run.detail.split("\n").slice(0, 3).join("; ")}` : ""}`,
      href: `/sync-runs?q=${encodeURIComponent(run.name)}`,
      hrefLabel: "See the run",
      at: run.finishedAt,
      dismissable: true,
    });
  }

  const waiting = updates.items.filter((i) => i.relevant && !reviews.has(updateKey(i)));
  if (waiting.length) {
    alerts.push({
      key: "updates-waiting",
      group: "updates",
      tone: waiting.some((i) => i.isNew) ? "accent" : "neutral",
      title: `${waiting.length} Shopify and Google ${waiting.length === 1 ? "update is" : "updates are"} waiting for review`,
      detail: waiting
        .slice(0, 3)
        .map((i) => i.title)
        .join(" · "),
      href: "/updates",
      hrefLabel: "Review on Updates",
      at: waiting[0]?.date ?? null,
      dismissable: false,
    });
  }

  const open = alerts.filter((a) => !a.dismissable || !doneMap.has(a.key));
  const done = alerts.filter((a) => a.dismissable && doneMap.has(a.key)).map((a) => ({ ...a, done: doneMap.get(a.key) }));
  return { open, done };
}

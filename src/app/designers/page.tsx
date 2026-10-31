import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckBrandButton, CheckOldestButton, ExternalLink, PartnerToggle } from "@/components/DesignerControls";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import form from "@/components/ui/Form.module.css";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBox";
import { SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { designers, RECHECK_DAYS } from "@/lib/designers";
import { isShopifyConnected } from "@/lib/shopify/client";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Designers" };
// "Check 5 oldest" reads several brand websites in a row.
export const maxDuration = 300;

type Search = Promise<Record<string, string | string[] | undefined>>;
const PER_PAGE = 25;
const VIEWS = [
  { key: "all", label: "All" },
  { key: "partners", label: "Partners" },
  { key: "recheck", label: "Needs recheck" },
] as const;

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }) : "-";

async function Designers({ searchParams }: { searchParams: Search }) {
  await connection();
  if (!isShopifyConnected() || !isDatabaseConnected()) {
    return <EmptyState title="Not connected yet" description="Designers needs both Shopify and the database (see Settings)." />;
  }
  const params = await searchParams;
  const view = VIEWS.find((v) => v.key === params.view)?.key ?? "all";
  const { rows: all } = await designers();
  const partners = all.filter((r) => r.partner);
  const recheck = all.filter((r) => r.needsRecheck);
  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const viewRows = view === "partners" ? partners : view === "recheck" ? recheck : all;
  const rows = q ? viewRows.filter((r) => `${r.name} ${r.site}`.toLowerCase().includes(q)) : [...viewRows];
  // Partners first, then by name.
  rows.sort((a, b) => Number(b.partner) - Number(a.partner) || a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pageFrom(params.page), pages);
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const inStock = all.reduce((sum, r) => sum + (r.brandInStock ?? 0), 0);
  return (
    <div className={form.stack}>
      <section className={styles.metrics} aria-label="Totals">
        <MetricCard label="Designers we track" value={String(all.length)} />
        <MetricCard label="Partner designers" value={String(partners.length)} />
        <MetricCard label={`Need a recheck (${RECHECK_DAYS}+ days)`} value={String(recheck.length)} />
        <MetricCard label="Pieces in stock at the brands" value={inStock.toLocaleString("en-GB")} />
      </section>

      <div className={styles.toolbar}>
      <nav className={styles.tabs} aria-label="Show">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={withParams("/designers", params, { view: v.key === "all" ? null : v.key, page: null })}
            className={`${styles.tab} ${view === v.key ? styles.tabOn : ""}`}
            aria-current={view === v.key ? "page" : undefined}
          >
            {v.label}
            <span className={styles.count}>{v.key === "partners" ? partners.length : v.key === "recheck" ? recheck.length : all.length}</span>
          </Link>
        ))}
      </nav>
        <SearchBar placeholder="Search designers" />
      </div>

      {shown.length ? (
        <>
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Designer</th>
                  <th>Partner</th>
                  <th className={table.num}>On our store</th>
                  <th className={table.num}>At the brand</th>
                  <th>Newest piece</th>
                  <th>Last checked</th>
                  <th aria-label="Check now" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.slug}>
                    <td data-label="Designer">
                      <strong>{r.name}</strong> {r.partner ? <Badge tone="accent">partner</Badge> : null}
                      <span className={table.sub}>
                        <ExternalLink href={r.site}>{r.site.replace(/^https?:\/\/(www\.)?/, "")}</ExternalLink>
                      </span>
                    </td>
                    <td data-label="Partner">
                      <PartnerToggle slug={r.slug} name={r.name} partner={r.partner} />
                    </td>
                    <td data-label="On our store" className={table.num}>
                      {r.ourProducts.toLocaleString("en-GB")}
                    </td>
                    <td data-label="At the brand" className={table.num}>
                      {r.brandProducts === null ? "-" : `${r.brandInStock?.toLocaleString("en-GB")} in stock`}
                      {r.brandProducts !== null ? (
                        <span className={table.sub}>
                          {(r.brandProducts - (r.brandInStock ?? 0)).toLocaleString("en-GB")} sold out · {r.brandProducts.toLocaleString("en-GB")} listed
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Newest piece">{day(r.newestAt)}</td>
                    <td data-label="Last checked">
                      {r.checkedAt ? day(r.checkedAt) : "never"}
                      {r.error ? (
                        <span className={table.sub}>
                          <Badge tone="warning">failed</Badge> {r.error}
                        </span>
                      ) : r.needsRecheck ? (
                        <span className={table.sub}>
                          <Badge tone="warning">recheck</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td data-label="">
                      <CheckBrandButton slug={r.slug} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            prevHref={page > 1 ? withParams("/designers", params, { page: page > 2 ? String(page - 1) : null }) : null}
            nextHref={page < pages ? withParams("/designers", params, { page: String(page + 1) }) : null}
            label={`Page ${page} of ${pages}`}
          />
        </>
      ) : (
        <EmptyState
          title={q ? "No designers match" : view === "partners" ? "No partners marked yet" : "Nothing needs a recheck"}
          description={q ? `Nothing found for "${q}".` : view === "partners" ? "Tick Partner on a designer under All." : "Every designer was checked in the last week."}
        />
      )}
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader
        title="Designers"
        description="Each designer's own website against our store: pieces in stock, newest release, when we last checked. A daily job checks 12 a day."
        actions={<CheckOldestButton />}
      />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards />
            <SkeletonTable rows={8} cols={7} />
          </div>
        }
      >
        <Designers searchParams={searchParams} />
      </Suspense>
    </>
  );
}

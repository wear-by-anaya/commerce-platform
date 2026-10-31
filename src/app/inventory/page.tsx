import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckOldestButton } from "@/components/DesignerControls";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import form from "@/components/ui/Form.module.css";
import { SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { designers, RECHECK_DAYS } from "@/lib/designers";
import { isShopifyConnected } from "@/lib/shopify/client";
import styles from "../designers/page.module.css";

export const metadata: Metadata = { title: "Inventory" };
export const maxDuration = 300;

const num = (n: number) => n.toLocaleString("en-GB");

async function Inventory() {
  await connection();
  if (!isShopifyConnected() || !isDatabaseConnected()) {
    return <EmptyState title="Not connected yet" description="Inventory needs both Shopify and the database (see Settings)." />;
  }
  const { rows, storeTotal, storeBrands } = await designers();
  const checked = rows.filter((r) => r.brandProducts !== null);
  const inStock = checked.reduce((s, r) => s + (r.brandInStock ?? 0), 0);
  const listed = checked.reduce((s, r) => s + (r.brandProducts ?? 0), 0);
  const recheck = rows
    .filter((r) => r.needsRecheck)
    .sort((a, b) => (b.daysSince ?? 1e9) - (a.daysSince ?? 1e9))
    .slice(0, 10);
  const soldOutAtBrand = checked.filter((r) => r.brandInStock === 0 && r.ourProducts > 0);
  return (
    <div className={form.stack}>
      <section className={styles.metrics} aria-label="Totals">
        <MetricCard label={`Products on our store · ${num(storeBrands)} designers`} value={num(storeTotal)} />
        <MetricCard label={`In stock at the brands · ${checked.length} checked`} value={num(inStock)} />
        <MetricCard label="Sold out at the brands" value={num(listed - inStock)} />
        <MetricCard label={`Designers to recheck (${RECHECK_DAYS}+ days)`} value={num(rows.filter((r) => r.needsRecheck).length)} />
      </section>

      {soldOutAtBrand.length ? (
        <section className={form.panel}>
          <div className={form.panelHead}>
            <h2 className={form.title}>Everything sold out at the brand, still on our store</h2>
            <p className={form.help}>Ask before hiding anything (store rule).</p>
          </div>
          <ul className={form.list}>
            {soldOutAtBrand.map((r) => (
              <li key={r.slug} className={form.listRow}>
                <span>{r.name}</span>
                <span>{num(r.ourProducts)} on our store</span>
                <span />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className={styles.headRow}>
          <h2 className={styles.section}>Oldest checks first</h2>
          <Link href="/designers?view=recheck">All that need a recheck</Link>
        </div>
        {recheck.length ? (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Designer</th>
                  <th className={table.num}>On our store</th>
                  <th>Last checked</th>
                </tr>
              </thead>
              <tbody>
                {recheck.map((r) => (
                  <tr key={r.slug}>
                    <td data-label="Designer">
                      {r.name} {r.partner ? <Badge tone="accent">partner</Badge> : null}
                    </td>
                    <td data-label="On our store" className={table.num}>
                      {num(r.ourProducts)}
                    </td>
                    <td data-label="Last checked">
                      {r.daysSince === null ? "never" : `${Math.floor(r.daysSince)} days ago`}
                      {r.error ? <span className={table.sub}>{r.error}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="All designers checked this week" description="The daily job keeps them fresh." />
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock across our store and the designers' own websites. Checks come from each brand's public product list."
        actions={<CheckOldestButton />}
      />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards />
            <SkeletonTable rows={6} cols={3} />
          </div>
        }
      >
        <Inventory />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { saveOrderCostAction } from "@/app/costs/actions";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import buttons from "@/components/ui/Button.module.css";
import { isDatabaseConnected } from "@/lib/db";
import { formatTotal } from "@/lib/invoice";
import { profitByOrder, runningCosts } from "@/lib/profit";
import { isShopifyConnected } from "@/lib/shopify/client";
import { formatDate } from "@/lib/shopify/orders";
import styles from "../costs/page.module.css";

export const metadata: Metadata = { title: "Profit" };

const percent = (value: number | null) => (value === null ? "-" : `${Math.round(value * 1000) / 10}%`);

async function Profit() {
  await connection();
  if (!isShopifyConnected() || !isDatabaseConnected()) {
    return <EmptyState title="Not connected yet" description="Profit needs both Shopify and the database (see Settings)." />;
  }
  const [{ rows, currency, errors }, running] = await Promise.all([profitByOrder(), runningCosts()]);
  const money = (value: number) => formatTotal(value, currency);
  const sum = (key: "revenue" | "productCost" | "shipping" | "other" | "profit") => rows.reduce((t, r) => t + r[key], 0);
  const revenue = sum("revenue");
  const profit = sum("profit");
  const monthly = [...running.monthly].map(([cur, value]) => formatTotal(value, cur)).join(" + ") || "none entered";
  return (
    <>
      {errors.length ? <p className={styles.notice}>Some order details could not be read: {errors[0]}</p> : null}
      <section className={styles.metrics} aria-label="Totals">
        <MetricCard label={`Sales · ${rows.length} orders`} value={money(revenue)} />
        <MetricCard label="Product cost" value={money(sum("productCost"))} />
        <MetricCard label="Shipping and other" value={money(sum("shipping") + sum("other"))} />
        <MetricCard label={`Profit · margin ${percent(revenue ? profit / revenue : null)}`} value={money(profit)} />
      </section>
      <p className={styles.notice}>
        Running costs, not taken off above: {monthly} a month. <Link href="/costs">Edit costs</Link>
      </p>
      {rows.length ? (
        <div className={table.wrap}>
          <table className={`${table.table} ${styles.wide}`}>
            <thead>
              <tr>
                <th>Order</th>
                <th className={table.num}>Sales</th>
                <th className={table.num}>Product cost</th>
                <th>Shipping · other</th>
                <th className={table.num}>Profit</th>
                <th className={table.num}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderId}>
                  <td>
                    {row.name}
                    <span className={table.sub}>{formatDate(row.date)}</span>
                  </td>
                  <td className={table.num}>{money(row.revenue)}</td>
                  <td className={table.num}>
                    {money(row.productCost)}
                    <span className={table.sub}>
                      {row.lines.some((l) => l.basis !== "own cost") ? "from brand prices" : "own costs"}
                    </span>
                  </td>
                  <td>
                    <form action={saveOrderCostAction} className={styles.inline}>
                      <input type="hidden" name="orderId" value={row.orderId} />
                      <input
                        name="shipping"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        defaultValue={row.shipping || ""}
                        placeholder="Shipping"
                        aria-label={`Shipping cost for ${row.name}`}
                      />
                      <input
                        name="other"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        defaultValue={row.other || ""}
                        placeholder="Other"
                        aria-label={`Other cost for ${row.name}`}
                      />
                      <button type="submit" className={buttons.secondary}>
                        Save
                      </button>
                    </form>
                  </td>
                  <td className={table.num}>{money(row.profit)}</td>
                  <td className={table.num}>{percent(row.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No orders to count" description="Cancelled orders are left out. Profit shows here once orders come in." />
      )}
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Profit"
        description="Last 25 orders in PKR, cancelled ones left out. Product cost = your own cost if entered, else the brand price less the brand discount."
        actions={
          <Link href="/costs" className={buttons.secondary}>
            Costs
          </Link>
        }
      />
      <Suspense fallback={<p>Loading profit…</p>}>
        <Profit />
      </Suspense>
    </>
  );
}

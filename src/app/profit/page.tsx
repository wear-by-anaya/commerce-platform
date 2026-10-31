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
import form from "@/components/ui/Form.module.css";
import { SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { formatTotal } from "@/lib/invoice";
import { expenses, profitByOrder } from "@/lib/profit";
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
  const [{ rows, currency, rates, errors }, spend] = await Promise.all([profitByOrder(), expenses()]);
  const money = (value: number) => formatTotal(value, currency);
  const sum = (key: "revenue" | "productCost" | "shipping" | "other" | "profit") => rows.reduce((t, r) => t + r[key], 0);
  const revenue = sum("revenue");
  const profit = sum("profit");
  const monthly = [...spend.monthly].map(([cur, value]) => formatTotal(value, cur)).join(" + ") || "none entered";
  const noRates = !rates.pakistan && !rates.abroad;
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
        Expenses, not taken off above: {monthly} a month. <Link href="/expenses">Expenses</Link>
        {noRates ? (
          <>
            {" "}
            · No shipping rate set yet, so shipping counts as 0. <Link href="/costs">Set rates</Link>
          </>
        ) : null}
      </p>
      {rows.length ? (
        <div className={table.wrap}>
          <table className={`${table.table} ${styles.wide}`}>
            <thead>
              <tr>
                <th>Order</th>
                <th className={table.num}>Sales</th>
                <th className={table.num}>Product cost</th>
                <th className={table.num}>Shipping</th>
                <th>Other costs</th>
                <th className={table.num}>Profit</th>
                <th className={table.num}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderId}>
                  <td>
                    {row.name}
                    <span className={table.sub}>
                      {formatDate(row.date)}
                      {row.country ? ` · ${row.country}` : ""}
                    </span>
                  </td>
                  <td className={table.num}>{money(row.revenue)}</td>
                  <td className={table.num}>
                    {money(row.productCost)}
                    <span className={table.sub}>{row.lines.some((l) => l.basis !== "own cost") ? "from brand prices" : "own costs"}</span>
                  </td>
                  <td className={table.num}>
                    {money(row.shipping)}
                    <span className={table.sub}>
                      {row.lines.some((l) => l.shippingBasis === "no weight") ? "some pieces have no weight" : "per product"}
                    </span>
                  </td>
                  <td>
                    <form action={saveOrderCostAction} className={styles.otherForm}>
                      <input type="hidden" name="orderId" value={row.orderId} />
                      <input
                        className={form.control}
                        name="other"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        defaultValue={row.other || ""}
                        placeholder="0"
                        aria-label={`Other costs for ${row.name}`}
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
        description="Last 25 orders in PKR, cancelled ones left out. Each cost goes under this store, which made the sale."
        actions={
          <Link href="/costs" className={buttons.secondary}>
            Costs
          </Link>
        }
      />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards />
            <SkeletonTable rows={5} cols={7} />
          </div>
        }
      >
        <Profit />
      </Suspense>
    </>
  );
}

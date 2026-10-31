import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteExpenseAction } from "@/app/costs/actions";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { ExpenseForm } from "@/components/ExpenseForm";
import { MetricCard } from "@/components/MetricCard";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import form from "@/components/ui/Form.module.css";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { SkeletonCards, SkeletonPanels } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { formatTotal } from "@/lib/invoice";
import { COST_CURRENCIES, EXPENSE_CATEGORIES, expenses } from "@/lib/profit";
import { displayDate } from "@/lib/manual-invoices";
import styles from "../costs/page.module.css";

export const metadata: Metadata = { title: "Expenses" };

const totals = (map: Map<string, number>) => [...map].map(([cur, value]) => formatTotal(value, cur)).join(" + ") || "None";
const every = (value: string) => (value === "once" ? "one-off" : `per ${value}`);

type Search = Promise<Record<string, string | string[] | undefined>>;
const PER_PAGE = 20;

async function Expenses({ searchParams }: { searchParams: Search }) {
  await connection();
  const params = await searchParams;
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Expenses are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const { list: all, monthly, oneOffThisMonth } = await expenses();
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const page = Math.min(pageFrom(params.page), pages);
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  return (
    <div className={form.stack}>
      <section className={`${styles.metrics} ${styles.pair}`} aria-label="Totals">
        <MetricCard label="Repeating, per month" value={totals(monthly)} />
        <MetricCard label="One-off, this month" value={totals(oneOffThisMonth)} />
      </section>

      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Add an expense</h2>
          <p className={form.help}>Anything the shop pays for: Shopify plan and fees, apps, Claude, Cursor, Google, domains, staff.</p>
        </div>
        <ExpenseForm categories={EXPENSE_CATEGORIES} currencies={COST_CURRENCIES} today={today} />
      </section>

      {list.length ? (
        <>
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th>What for</th>
                  <th>Category</th>
                  <th>Date paid</th>
                  <th className={table.num}>Amount</th>
                  <th>How often</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className={styles.middle}>
                    <td data-label="What for">
                      {e.name}
                      {e.note ? <span className={table.sub}>{e.note}</span> : null}
                    </td>
                    <td data-label="Category">{e.category}</td>
                    <td data-label="Date paid">{e.paidOn ? displayDate(e.paidOn) : "-"}</td>
                    <td data-label="Amount" className={table.num}>{formatTotal(e.amount, e.currency)}</td>
                    <td data-label="How often">{every(e.every)}</td>
                    <td data-label="" className={table.num}>
                      <form action={deleteExpenseAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className={form.iconButton} aria-label={`Remove ${e.name}`}>
                          <Icon name="close" size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            prevHref={page > 1 ? withParams("/expenses", params, { page: page > 2 ? String(page - 1) : null }) : null}
            nextHref={page < pages ? withParams("/expenses", params, { page: String(page + 1) }) : null}
            label={`Page ${page} of ${pages}`}
          />
        </>
      ) : (
        <EmptyState title="No expenses yet" description="Add the first one above, e.g. the Shopify plan." />
      )}
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader title="Expenses" description="What running the shop costs, entered by hand. Totals are kept per currency." />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards count={2} />
            <SkeletonPanels count={1} />
          </div>
        }
      >
        <Expenses searchParams={searchParams} />
      </Suspense>
    </>
  );
}

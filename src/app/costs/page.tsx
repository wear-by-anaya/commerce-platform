import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  addRunningCostAction,
  deleteBrandDiscountAction,
  deleteRunningCostAction,
  saveBrandDiscountAction,
} from "@/app/costs/actions";
import { EmptyState } from "@/components/EmptyState";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import { ProductCostUpload } from "@/components/ProductCostUpload";
import buttons from "@/components/ui/Button.module.css";
import { isDatabaseConnected } from "@/lib/db";
import { formatTotal } from "@/lib/invoice";
import { brandDiscounts, COST_CURRENCIES, DEFAULT_DISCOUNT, EVERY, runningCosts } from "@/lib/profit";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Costs" };

async function Costs() {
  await connection();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Costs are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const [discounts, running] = await Promise.all([brandDiscounts(), runningCosts()]);
  return (
    <>
      <section className={styles.panel}>
        <h2 className={styles.title}>Supplier discount per brand</h2>
        <p className={styles.help}>
          What we pay = brand price less this discount. Brands not listed use {DEFAULT_DISCOUNT}%. Write the brand name as Shopify shows it.
        </p>
        <form action={saveBrandDiscountAction} className={styles.inline}>
          <input name="brand" required maxLength={120} placeholder="Brand, e.g. Afrozeh" aria-label="Brand" />
          <input name="percent" type="number" inputMode="decimal" min="0" max="100" step="any" required placeholder="%" aria-label="Discount percent" />
          <button type="submit" className={buttons.button}>
            Save
          </button>
        </form>
        {discounts.length ? (
          <ul className={styles.rows}>
            {discounts.map((d) => (
              <li key={d.brand}>
                <span>{d.brand}</span>
                <strong>{d.percent}%</strong>
                <form action={deleteBrandDiscountAction}>
                  <input type="hidden" name="brand" value={d.brand} />
                  <button type="submit" className={styles.remove} aria-label={`Remove ${d.brand}`}>
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.title}>Own cost per product</h2>
        <p className={styles.help}>
          For pieces where the discount rule is wrong. Download the sheet, fill in &quot;Own cost (PKR)&quot; in Excel, save it as CSV and
          upload it. An empty cell sends that product back to the discount rule.
        </p>
        <div className={styles.inline}>
          <a href="/costs/sheet" className={buttons.secondary}>
            Download sheet
          </a>
        </div>
        <ProductCostUpload />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.title}>Running costs</h2>
        <p className={styles.help}>Shopify plan, apps, domains, staff and the like. The Profit page shows them as a monthly total.</p>
        <form action={addRunningCostAction} className={styles.inline}>
          <input name="name" required maxLength={120} placeholder="e.g. Shopify Basic" aria-label="Cost name" />
          <input name="amount" type="number" inputMode="decimal" min="0" step="any" required placeholder="Amount" aria-label="Amount" />
          <select name="currency" aria-label="Currency" defaultValue="USD">
            {COST_CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select name="every" aria-label="How often" defaultValue="month">
            {EVERY.map((e) => (
              <option key={e} value={e}>
                {e === "once" ? "one-off" : `per ${e}`}
              </option>
            ))}
          </select>
          <button type="submit" className={buttons.button}>
            Add
          </button>
        </form>
        {running.list.length ? (
          <div className={table.wrap}>
            <table className={table.table}>
              <tbody>
                {running.list.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className={table.num}>{formatTotal(c.amount, c.currency)}</td>
                    <td>{c.every === "once" ? "one-off" : `per ${c.every}`}</td>
                    <td className={table.num}>
                      <form action={deleteRunningCostAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className={styles.remove} aria-label={`Remove ${c.name}`}>
                          ×
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Costs" description="What the goods and running the shop cost. The Profit page uses these." />
      <Suspense fallback={<p>Loading costs…</p>}>
        <Costs />
      </Suspense>
    </>
  );
}

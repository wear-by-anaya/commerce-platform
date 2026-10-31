import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteBrandDiscountAction, saveBrandDiscountAction, saveShippingRatesAction } from "@/app/costs/actions";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCostUpload } from "@/components/ProductCostUpload";
import buttons from "@/components/ui/Button.module.css";
import form from "@/components/ui/Form.module.css";
import { SkeletonPanels } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { brandDiscounts, DEFAULT_DISCOUNT, shippingRates } from "@/lib/profit";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Costs" };

async function Costs() {
  await connection();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Costs are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const [discounts, rates] = await Promise.all([brandDiscounts(), shippingRates()]);
  return (
    <div className={form.stack}>
      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Supplier discount per brand</h2>
          <p className={form.help}>
            What we pay a brand = its price less this discount. Brands not listed use {DEFAULT_DISCOUNT}%. Write the brand name as Shopify shows it.
          </p>
        </div>
        <form action={saveBrandDiscountAction} className={form.row}>
          <label className={form.field}>
            <span className={form.label}>Brand</span>
            <input className={form.control} name="brand" required maxLength={120} placeholder="e.g. Afrozeh" />
          </label>
          <label className={`${form.field} ${form.narrow}`}>
            <span className={form.label}>Discount %</span>
            <input className={form.control} name="percent" type="number" inputMode="decimal" min="0" max="100" step="any" required />
          </label>
          <button type="submit" className={buttons.button}>
            Save
          </button>
        </form>
        {discounts.length ? (
          <ul className={form.list}>
            {discounts.map((d) => (
              <li key={d.brand} className={form.listRow}>
                <span>{d.brand}</span>
                <strong>{d.percent}%</strong>
                <form action={deleteBrandDiscountAction}>
                  <input type="hidden" name="brand" value={d.brand} />
                  <button type="submit" className={form.iconButton} aria-label={`Remove ${d.brand}`}>
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Shipping by weight</h2>
          <p className={form.help}>
            Shipping per piece = its Shopify weight × the rate per kg for the order&apos;s country. A product&apos;s own shipping in the sheet
            below wins over this. Leave a rate empty to count no shipping.
          </p>
        </div>
        <form action={saveShippingRatesAction} className={form.row}>
          <label className={form.field}>
            <span className={form.label}>Pakistan, PKR per kg</span>
            <input className={form.control} name="pakistan" type="number" inputMode="decimal" min="0" step="any" defaultValue={rates.pakistan || ""} />
          </label>
          <label className={form.field}>
            <span className={form.label}>Abroad, PKR per kg</span>
            <input className={form.control} name="abroad" type="number" inputMode="decimal" min="0" step="any" defaultValue={rates.abroad || ""} />
          </label>
          <button type="submit" className={buttons.button}>
            Save rates
          </button>
        </form>
      </section>

      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Own cost and shipping per product</h2>
          <p className={form.help}>
            For pieces where a rule is wrong. Download the sheet, fill in &quot;Own cost (PKR)&quot; or &quot;Own shipping (PKR)&quot; in Excel,
            save it as CSV and upload it. An empty cell goes back to the rule.
          </p>
        </div>
        <div className={styles.sheet}>
          <a href="/costs/sheet" className={buttons.secondary}>
            Download sheet
          </a>
          <ProductCostUpload />
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Costs" description="What we pay for the goods and their shipping. The Profit page uses these." />
      <Suspense fallback={<SkeletonPanels count={3} />}>
        <Costs />
      </Suspense>
    </>
  );
}

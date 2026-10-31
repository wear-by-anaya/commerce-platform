import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/EmptyState";
import { isDatabaseConnected } from "@/lib/db";
import { formatTotal } from "@/lib/invoice";
import { listManualInvoices } from "@/lib/manual-invoices";
import styles from "./OrdersTable.module.css";

/** Invoices and estimates made by hand in this dashboard, newest first. */
export async function SavedInvoices() {
  await connection();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Saved invoices need Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  let rows: Awaited<ReturnType<typeof listManualInvoices>>;
  try {
    rows = await listManualInvoices();
  } catch {
    return <EmptyState title="Saved invoices could not be loaded" description="The database did not answer. Reload the page in a minute." />;
  }
  if (!rows.length) {
    return <EmptyState title="No saved invoices yet" description="Use New invoice for sales outside the online store." />;
  }
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Number</th>
            <th>Date</th>
            <th>Customer</th>
            <th className={styles.num}>Total</th>
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, invoice, total }) => (
            <tr key={id}>
              <td>
                {invoice.number}
                <span className={styles.sub}>{invoice.kind.toLowerCase()}</span>
              </td>
              <td>{invoice.date}</td>
              <td>{invoice.billTo[0] ?? "-"}</td>
              <td className={styles.num}>{formatTotal(total, invoice.currency)}</td>
              <td>
                <Link href={`/invoices/manual/${id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

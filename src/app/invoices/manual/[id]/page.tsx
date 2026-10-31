import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeleteInvoiceButton } from "@/components/DeleteInvoiceButton";
import { EmptyState } from "@/components/EmptyState";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "@/components/PrintButton";
import buttons from "@/components/ui/Button.module.css";
import { isDatabaseConnected } from "@/lib/db";
import { getManualInvoice } from "@/lib/manual-invoices";
import styles from "../../toolbar.module.css";

export const metadata: Metadata = { title: "Invoice" };

async function SavedInvoice({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const invoice = /^\d+$/.test(id) && isDatabaseConnected() ? await getManualInvoice(Number(id)) : null;
  if (!invoice) {
    return <EmptyState title="Invoice not found" description="It may have been deleted. Go back to Invoices." />;
  }
  return (
    <>
      <div className={styles.toolbar} data-print-hide>
        <Link href="/invoices" className={buttons.secondary}>Back</Link>
        <span className={styles.spacer} />
        <DeleteInvoiceButton id={Number(id)} number={invoice.number} />
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} />
    </>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading invoice…</p>}>
      <SavedInvoice params={params} />
    </Suspense>
  );
}

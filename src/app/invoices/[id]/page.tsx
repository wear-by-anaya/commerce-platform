import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "@/components/PrintButton";
import { isShopifyConnected } from "@/lib/shopify/client";
import { orderInvoice } from "@/lib/shopify/orders";

export const metadata: Metadata = { title: "Invoice" };

async function OrderInvoice({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const { invoice } = /^\d+$/.test(id) && isShopifyConnected() ? await orderInvoice(id) : { invoice: null };
  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="This order could not be read from Shopify. Go back to Invoices and open it again."
      />
    );
  }
  return <InvoiceDocument invoice={invoice} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", maxWidth: "210mm", margin: "0 auto", padding: 16 }} data-print-hide>
        <PrintButton />
      </div>
      <Suspense fallback={<p>Loading invoice…</p>}>
        <OrderInvoice params={params} />
      </Suspense>
    </>
  );
}

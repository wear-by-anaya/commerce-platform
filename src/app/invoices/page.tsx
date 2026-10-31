import Link from "next/link";
import { Suspense } from "react";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Open an order's invoice, then print it or save it as a PDF."
        actions={<Link href="/invoices/sample">Sample invoice</Link>}
      />
      <Suspense fallback={<p>Loading orders…</p>}>
        <RecentOrders />
      </Suspense>
    </>
  );
}

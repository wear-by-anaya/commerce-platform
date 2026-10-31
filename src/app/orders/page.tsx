import { Suspense } from "react";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Orders" description="The latest 50 orders from Shopify, newest first." />
      <Suspense fallback={<p>Loading orders…</p>}>
        <RecentOrders />
      </Suspense>
    </>
  );
}

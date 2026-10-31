import { Suspense } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Orders" description="The latest 50 orders from Shopify, newest first." />
      <Suspense fallback={<SkeletonTable rows={6} cols={7} />}>
        <RecentOrders />
      </Suspense>
    </>
  );
}

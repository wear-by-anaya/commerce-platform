import { Suspense } from "react";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";

type Search = Promise<Record<string, string | string[] | undefined>>;

async function Orders({ searchParams }: { searchParams: Search }) {
  return <RecentOrders first={25} path="/orders" params={await searchParams} />;
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader title="Orders" description="All orders from Shopify, newest first, 25 per page." />
      <Suspense fallback={<SkeletonTable rows={6} cols={7} />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

import { Suspense } from "react";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import { SearchBar } from "@/components/ui/SearchBox";
import { SkeletonTable } from "@/components/ui/Skeleton";
import styles from "../invoices/page.module.css";

type Search = Promise<Record<string, string | string[] | undefined>>;

async function Orders({ searchParams }: { searchParams: Search }) {
  return <RecentOrders first={25} path="/orders" params={await searchParams} />;
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader title="Orders" description="All orders from Shopify, newest first, 25 per page." />
      <div className={styles.searchRow}>
        <SearchBar placeholder="Search orders: number, name or email" />
      </div>
      <Suspense fallback={<SkeletonTable rows={6} cols={7} />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

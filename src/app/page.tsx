import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SkeletonCards, SkeletonList, SkeletonTable } from "@/components/ui/Skeleton";
import { MetricCard } from "@/components/MetricCard";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import { UpdatesList } from "@/components/UpdatesList";
import buttons from "@/components/ui/Button.module.css";
import { formatTotal } from "@/lib/invoice";
import { isShopifyConnected } from "@/lib/shopify/client";
import { orderStats } from "@/lib/shopify/orders";
import { platformUpdates, updateKey, updateReviews } from "@/lib/updates";
import styles from "./page.module.css";

async function Metrics() {
  await connection();
  // The orders list below explains a missing connection; no second message here.
  if (!isShopifyConnected()) return null;
  const stats = await orderStats();
  const money = (value: number) => formatTotal(value, stats.currency);
  return (
    <section className={styles.metrics} aria-label="Key figures">
      <MetricCard label="Orders today" value={String(stats.ordersToday)} />
      <MetricCard label="Sales today" value={money(stats.revenueToday)} />
      <MetricCard
        label={`Sales, last 7 days · ${stats.ordersWeek} ${stats.ordersWeek === 1 ? "order" : "orders"}`}
        value={money(stats.revenueWeek)}
      />
      <MetricCard label="Orders to send" value={String(stats.openOrders)} />
    </section>
  );
}

async function LatestUpdates() {
  await connection();
  const [{ items }, reviews] = await Promise.all([platformUpdates(14), updateReviews()]);
  const open = items.filter((i) => i.relevant && !reviews.has(updateKey(i)));
  if (!open.length) return null;
  const fresh = open.filter((i) => i.isNew).length;
  const important = open.slice(0, 3);
  return (
    <section>
      <div className={styles.sectionHead}>
        <h2 className={styles.section}>Shopify and Google updates to review · {open.length}{fresh ? ` (${fresh} new)` : ""}</h2>
        <Link href="/updates">See all</Link>
      </div>
      <UpdatesList items={important} />
    </section>
  );
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        description="Today's orders and sales, Pakistan time. Cancelled orders are not counted."
        actions={<Link href="/orders" className={buttons.secondary}>All orders</Link>}
      />
      <Suspense fallback={<SkeletonCards />}>
        <Metrics />
      </Suspense>
      <Suspense fallback={<SkeletonTable rows={5} cols={7} />}>
        <RecentOrders first={5} />
      </Suspense>
      <Suspense fallback={<SkeletonList rows={3} />}>
        <LatestUpdates />
      </Suspense>
    </div>
  );
}

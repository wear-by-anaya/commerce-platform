import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import buttons from "@/components/ui/Button.module.css";
import { formatTotal } from "@/lib/invoice";
import { isShopifyConnected } from "@/lib/shopify/client";
import { orderStats } from "@/lib/shopify/orders";
import styles from "./page.module.css";

async function Metrics() {
  await connection();
  if (!isShopifyConnected()) {
    return <EmptyState title="Shopify is not connected" description="Add the Shopify values in Vercel, then redeploy." />;
  }
  const stats = await orderStats();
  const money = (value: number) => formatTotal(value, stats.currency);
  return (
    <section className={styles.metrics} aria-label="Key figures">
      <MetricCard label="Orders today" value={String(stats.ordersToday)} />
      <MetricCard label="Sales today" value={money(stats.revenueToday)} />
      <MetricCard label="Sales, last 7 days" value={`${money(stats.revenueWeek)} · ${stats.ordersWeek}`} />
      <MetricCard label="Orders to send" value={String(stats.openOrders)} />
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
      <Suspense fallback={<p>Loading figures…</p>}>
        <Metrics />
      </Suspense>
      <Suspense fallback={<p>Loading orders…</p>}>
        <RecentOrders first={5} />
      </Suspense>
    </div>
  );
}

import { DashboardActions } from "@/components/DashboardActions";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import styles from "./page.module.css";

const METRICS = [
  { label: "Orders today", value: "—" },
  { label: "Revenue today", value: "—" },
  { label: "Inventory changes", value: "—" },
  { label: "Sync status", value: "—" },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        description="Overview of store operations once Shopify and sync services are connected."
        actions={<DashboardActions />}
      />

      <section className={styles.metrics} aria-label="Key metrics">
        {METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <EmptyState
        title="No live data yet"
        description="This workspace is ready. Connect Shopify, authentication, and the shared commerce engine to populate orders, inventory, and sync history."
      />
    </div>
  );
}

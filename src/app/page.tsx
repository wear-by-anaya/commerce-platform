import { DashboardActions } from "@/components/DashboardActions";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { STORE_BRAND } from "@/lib/config";
import styles from "./page.module.css";

const CARDS = [
  { label: "Orders Today", value: "—", status: "NOT_CONNECTED" as const },
  { label: "Revenue Today", value: "—", status: "NOT_CONNECTED" as const },
  { label: "Inventory Changes", value: "—", status: "NOT_CONNECTED" as const },
  { label: "Source Issues", value: "—", status: "NOT_CONNECTED" as const },
  { label: "Stock Sync Status", value: "—", status: "NOT_CONNECTED" as const },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title={STORE_BRAND}
        description="Internal operations dashboard for orders, inventory, designers, sync runs, and reviews. Values stay blank until integrations are connected."
        actions={<DashboardActions />}
      />
      <section className={styles.grid} aria-label="Operations metrics">
        {CARDS.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>
    </div>
  );
}

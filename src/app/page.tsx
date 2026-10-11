import { DashboardActions } from "@/components/DashboardActions";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { STORE_BRAND } from "@/lib/config";
import styles from "./page.module.css";

const CARDS = [
  {
    label: "Orders Today",
    value: "—",
    status: "NOT_CONNECTED" as const,
    tooltip: "Order counts appear after Shopify orders access is connected.",
  },
  {
    label: "Revenue Today",
    value: "—",
    status: "NOT_CONNECTED" as const,
    tooltip: "Revenue totals stay blank until commerce data is wired.",
  },
  {
    label: "Inventory Changes",
    value: "—",
    status: "NOT_CONNECTED" as const,
    tooltip: "Inventory deltas require the shared engine integration.",
  },
  {
    label: "Source Issues",
    value: "—",
    status: "NOT_CONNECTED" as const,
    tooltip: "Designer source issues are not polled from this app yet.",
  },
  {
    label: "Stock Sync Status",
    value: "—",
    status: "NOT_CONNECTED" as const,
    tooltip: "Production stock sync remains outside this boilerplate.",
  },
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

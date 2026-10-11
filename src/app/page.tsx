import { MetricCard } from "@/components/MetricCard";
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
      <header className={styles.header}>
        <h1 className={styles.title}>{STORE_BRAND}</h1>
        <p className={styles.subtitle}>Operations Platform</p>
        <p className={styles.note}>
          Internal boilerplate only. No Shopify, database, auth, or stock worker is connected.
          Metric values are intentionally blank and marked NOT CONNECTED.
        </p>
      </header>
      <section className={styles.grid} aria-label="Operations metrics">
        {CARDS.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>
    </div>
  );
}

import type { OpsMetricCard } from "@/types/ops";
import styles from "./MetricCard.module.css";

export function MetricCard({ label, value, status }: OpsMetricCard) {
  return (
    <article className={styles.card}>
      <h2 className={styles.label}>{label}</h2>
      <p className={styles.value}>{value}</p>
      <p className={styles.status}>{status}</p>
    </article>
  );
}

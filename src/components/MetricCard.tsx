import { Tooltip } from "@/components/ui/Tooltip";
import type { OpsMetricCard } from "@/types/ops";
import styles from "./MetricCard.module.css";

export function MetricCard({
  label,
  value,
  status,
  tooltip,
}: OpsMetricCard & { tooltip?: string }) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <h2 className={styles.label}>{label}</h2>
        {tooltip ? (
          <Tooltip content={tooltip}>
            <span className={styles.hint} tabIndex={0} aria-label={`${label} info`}>
              i
            </span>
          </Tooltip>
        ) : null}
      </div>
      <p className={styles.value}>{value}</p>
      <p className={styles.status}>{status}</p>
    </article>
  );
}

import styles from "./Skeleton.module.css";

/** Loading placeholders shaped like the content that replaces them. Screen readers hear one "Loading" label. */
function Bar({ width = "100%", height = 14 }: { width?: string; height?: number }) {
  return <span className={styles.bar} style={{ width, height }} />;
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.cards} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          <Bar width="55%" height={12} />
          <Bar width="40%" height={26} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.box} role="status" aria-label="Loading">
      <div className={styles.tableRow}>
        {Array.from({ length: cols }, (_, c) => (
          <Bar key={c} width="50%" height={10} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: cols }, (_, c) => (
            <Bar key={c} width={c === 0 ? "60%" : `${55 + ((r * 7 + c * 13) % 40)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.box} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.listRow}>
          <Bar width="48px" height={12} />
          <span className={styles.lines}>
            <Bar width={`${60 + ((r * 11) % 30)}%`} />
            <Bar width="30%" height={10} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanels({ count = 2 }: { count?: number }) {
  return (
    <div className={styles.stack} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.panel}>
          <Bar width="30%" height={16} />
          <Bar width="70%" height={12} />
          <div className={styles.fields}>
            <Bar height={44} />
            <Bar height={44} />
            <Bar height={44} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDocument() {
  return (
    <div className={styles.document} role="status" aria-label="Loading">
      <div className={styles.docHead}>
        <span className={styles.lines}>
          <Bar width="40%" height={16} />
          <Bar width="70%" />
          <Bar width="50%" />
        </span>
        <Bar width="96px" height={64} />
      </div>
      <Bar width="20%" height={20} />
      <div className={styles.fields}>
        <Bar height={64} />
        <Bar height={64} />
        <Bar height={64} />
      </div>
      <Bar height={36} />
      <Bar height={36} />
      <div className={styles.docTotals}>
        <Bar />
        <Bar />
        <Bar height={20} />
      </div>
    </div>
  );
}

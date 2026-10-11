"use client";

import styles from "./Tooltip.module.css";

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right";
}) {
  return (
    <span className={`${styles.wrap} ${styles[side]}`}>
      {children}
      <span role="tooltip" className={styles.tip}>
        {content}
      </span>
    </span>
  );
}

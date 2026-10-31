"use client";

import styles from "./PrintButton.module.css";

export function PrintButton() {
  return (
    <button type="button" className={styles.button} onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}

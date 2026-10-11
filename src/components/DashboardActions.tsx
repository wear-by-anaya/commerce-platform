"use client";

import { useToast } from "@/components/ui/Toast";
import styles from "./DashboardActions.module.css";

export function DashboardActions() {
  const { toast } = useToast();

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.primary}
        onClick={() =>
          toast({
            title: "Shopify not connected",
            description: "Connect a store app and credentials before refreshing metrics.",
            tone: "warning",
          })
        }
      >
        Refresh metrics
      </button>
      <button
        type="button"
        className={styles.secondary}
        onClick={() =>
          toast({
            title: "Sync unavailable",
            description: "Stock sync is not started from this operations platform yet.",
            tone: "info",
          })
        }
      >
        Run sync check
      </button>
    </div>
  );
}

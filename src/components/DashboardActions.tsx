"use client";

import { useToast } from "@/components/ui/Toast";
import styles from "./DashboardActions.module.css";

export function DashboardActions() {
  const { toast } = useToast();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() =>
        toast({
          title: "Not connected",
          description: "Shopify and workers are not linked to this workspace yet.",
          tone: "warning",
        })
      }
    >
      Refresh
    </button>
  );
}

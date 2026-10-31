"use client";

import { useActionState } from "react";
import { uploadProductCostsAction, type ActionState } from "@/app/costs/actions";
import styles from "@/app/costs/page.module.css";
import buttons from "./ui/Button.module.css";

export function ProductCostUpload() {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadProductCostsAction, { message: null, error: false });
  return (
    <form action={action} className={styles.inline}>
      <input type="file" name="file" accept=".csv,text/csv" required aria-label="CSV file with product costs" />
      <button type="submit" className={buttons.button} disabled={pending}>
        {pending ? "Uploading…" : "Upload sheet"}
      </button>
      {state.message ? (
        <p className={state.error ? styles.error : styles.ok} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

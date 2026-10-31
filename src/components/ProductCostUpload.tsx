"use client";

import { useActionState } from "react";
import { uploadProductCostsAction, type ActionState } from "@/app/costs/actions";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";

export function ProductCostUpload() {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadProductCostsAction, { message: null, error: false });
  return (
    <form action={action} className={form.stack}>
      <div className={form.row}>
        <label className={form.field}>
          <span className={form.label}>Filled-in sheet (CSV)</span>
          <input className={form.control} type="file" name="file" accept=".csv,text/csv" required />
        </label>
        <button type="submit" className={buttons.button} disabled={pending}>
          {pending ? "Uploading…" : "Upload sheet"}
        </button>
      </div>
      {state.message ? (
        <p className={state.error ? form.error : form.message} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

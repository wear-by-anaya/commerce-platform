"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/app/costs/actions";
import { logRunAction } from "@/app/sync-runs/actions";
import { RUN_KINDS, RUN_STATUSES } from "@/lib/run-kinds";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";
import { Select } from "./ui/Select";

/** "Log a run" form for jobs done by hand; the scripts and the daily check log their own runs. */
export function SyncRunForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(logRunAction, { message: null, error: false });
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.error) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className={form.stack}>
      <div className={`${form.grid} ${form.grid3}`}>
        <label className={`${form.field} ${form.span}`}>
          <span className={form.label}>What was done</span>
          <input className={form.control} name="name" required maxLength={160} placeholder="e.g. Sifa import, Unstitched day 6" />
        </label>
        <Select name="kind" label="Kind" options={RUN_KINDS} defaultValue="import" />
        <Select name="status" label="How it went" options={RUN_STATUSES} defaultValue="ok" />
        <label className={form.field}>
          <span className={form.label}>Date</span>
          <input className={form.control} name="day" type="date" defaultValue={today} />
        </label>
        <label className={form.field}>
          <span className={form.label}>Done (products, sizes, brands)</span>
          <input className={form.control} name="items" type="number" inputMode="numeric" min="0" step="1" defaultValue="0" />
        </label>
        <label className={form.field}>
          <span className={form.label}>Errors</span>
          <input className={form.control} name="errors" type="number" inputMode="numeric" min="0" step="1" defaultValue="0" />
        </label>
        <label className={`${form.field} ${form.span}`}>
          <span className={form.label}>Note (optional)</span>
          <textarea className={form.control} name="detail" maxLength={2000} placeholder="What failed, what is left, where the files are" />
        </label>
      </div>
      {state.message ? (
        <p className={state.error ? form.error : form.message} role="status">
          {state.message}
        </p>
      ) : null}
      <div className={form.actions}>
        <button type="submit" className={buttons.button} disabled={pending}>
          {pending ? "Logging…" : "Log run"}
        </button>
      </div>
    </form>
  );
}

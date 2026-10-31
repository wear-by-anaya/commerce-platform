"use client";

import { useActionState, useEffect, useRef } from "react";
import { addExpenseAction, type ActionState } from "@/app/costs/actions";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";
import { Select } from "./ui/Select";

const EVERY = [
  { value: "month", label: "Every month" },
  { value: "year", label: "Every year" },
  { value: "once", label: "One-off" },
];

export function ExpenseForm({ categories, currencies, today }: { categories: readonly string[]; currencies: readonly string[]; today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addExpenseAction, { message: null, error: false });
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.error) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className={form.stack}>
      <div className={`${form.grid} ${form.grid3}`}>
        <label className={form.field}>
          <span className={form.label}>What for</span>
          <input className={form.control} name="name" required maxLength={120} placeholder="e.g. Claude, Cursor, Shopify Basic" />
        </label>
        <Select name="category" label="Category" options={categories} defaultValue="Other" />
        <label className={form.field}>
          <span className={form.label}>Date paid</span>
          <input className={form.control} name="paidOn" type="date" defaultValue={today} />
        </label>
        <label className={form.field}>
          <span className={form.label}>Amount</span>
          <input className={form.control} name="amount" type="number" inputMode="decimal" min="0" step="any" required />
        </label>
        <Select name="currency" label="Currency" options={currencies} defaultValue="USD" />
        <Select name="every" label="How often" options={EVERY} defaultValue="month" />
        <label className={`${form.field} ${form.span}`}>
          <span className={form.label}>Note (optional)</span>
          <textarea className={form.control} name="note" maxLength={500} placeholder="e.g. paid with the company card, invoice in email" />
        </label>
      </div>
      {state.message ? (
        <p className={state.error ? form.error : form.message} role="status">
          {state.message}
        </p>
      ) : null}
      <div className={form.actions}>
        <button type="submit" className={buttons.button} disabled={pending}>
          {pending ? "Adding…" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

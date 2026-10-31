"use client";

import { useActionState, useState } from "react";
import { createInvoiceAction, type FormState } from "@/app/invoices/actions";
import { formatTotal } from "@/lib/invoice";
import buttons from "./ui/Button.module.css";
import styles from "./InvoiceForm.module.css";

type Line = { service: string; description: string; quantity: string; rate: string };

const emptyLine = (): Line => ({ service: "", description: "", quantity: "1", rate: "" });

export function InvoiceForm({ currencies, today }: { currencies: readonly string[]; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createInvoiceAction, { error: null });
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [currency, setCurrency] = useState(currencies[0]);
  const [discount, setDiscount] = useState("");
  const [shipping, setShipping] = useState("");
  const [sameAddress, setSameAddress] = useState(true);

  const update = (index: number, key: keyof Line, value: string) =>
    setLines((all) => all.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  const amount = (line: Line) => (Number(line.quantity) || 0) * (Number(line.rate) || 0);
  const subtotal = lines.reduce((sum, line) => sum + amount(line), 0);
  const discountValue = (subtotal * (Number(discount) || 0)) / 100;
  const total = subtotal - discountValue + (Number(shipping) || 0);

  return (
    <form action={action} className={styles.form}>
      <section className={styles.panel}>
        <h2 className={styles.heading}>Details</h2>
        <div className={styles.grid3}>
          <label className={styles.field}>
            <span>Type</span>
            <select name="kind" defaultValue="Invoice">
              <option>Invoice</option>
              <option>Estimate</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Date</span>
            <input type="date" name="date" defaultValue={today} required />
          </label>
          <label className={styles.field}>
            <span>Currency</span>
            <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>Customer</h2>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Bill to</span>
            <textarea name="billTo" rows={4} required placeholder={"Name\nAddress line\nCity, Country"} />
            <small>One line per row: name, address, city, phone.</small>
          </label>
          <div className={styles.field}>
            <label className={styles.check}>
              <input type="checkbox" name="sameAddress" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
              <span>Ship to the same address</span>
            </label>
            {sameAddress ? null : (
              <label className={styles.field}>
                <span>Ship to</span>
                <textarea name="shipTo" rows={4} />
              </label>
            )}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>Items</h2>
        <div className={styles.lineHead} aria-hidden="true">
          <span>Item or service</span>
          <span>Description</span>
          <span>Qty</span>
          <span>Rate</span>
          <span className={styles.right}>Amount</span>
          <span />
        </div>
        <ol className={styles.lines}>
          {lines.map((line, index) => (
            <li key={index} className={styles.line}>
              <label className={styles.field}>
                <span className={styles.mobileLabel}>Item or service</span>
                <input value={line.service} onChange={(e) => update(index, "service", e.target.value)} maxLength={500} />
              </label>
              <label className={styles.field}>
                <span className={styles.mobileLabel}>Description</span>
                <input value={line.description} onChange={(e) => update(index, "description", e.target.value)} maxLength={500} />
              </label>
              <label className={styles.field}>
                <span className={styles.mobileLabel}>Qty</span>
                <input type="number" inputMode="decimal" min="0" step="any" value={line.quantity} onChange={(e) => update(index, "quantity", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.mobileLabel}>Rate</span>
                <input type="number" inputMode="decimal" min="0" step="any" value={line.rate} onChange={(e) => update(index, "rate", e.target.value)} />
              </label>
              <p className={styles.amount}>{formatTotal(amount(line), currency)}</p>
              <button
                type="button"
                className={styles.remove}
                onClick={() => setLines((all) => (all.length > 1 ? all.filter((_, i) => i !== index) : [emptyLine()]))}
                aria-label={`Remove line ${index + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={`${buttons.secondary} ${styles.addLine}`} onClick={() => setLines((all) => [...all, emptyLine()])}>
          Add line
        </button>
        <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.heading}>Totals</h2>
        <div className={styles.grid2}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Discount %</span>
              <input type="number" inputMode="decimal" name="discountPercent" min="0" max="100" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Shipping</span>
              <input type="number" inputMode="decimal" name="shipping" min="0" step="any" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </label>
          </div>
          <dl className={styles.totals}>
            <dt>Subtotal</dt>
            <dd>{formatTotal(subtotal, currency)}</dd>
            <dt>Discount</dt>
            <dd>-{formatTotal(discountValue, currency)}</dd>
            <dt>Shipping</dt>
            <dd>{formatTotal(Number(shipping) || 0, currency)}</dd>
            <dt className={styles.grand}>Total</dt>
            <dd className={styles.grand}>{formatTotal(total, currency)}</dd>
          </dl>
        </div>
        <label className={styles.field}>
          <span>Note on the invoice (optional)</span>
          <textarea name="notes" rows={2} maxLength={500} placeholder="e.g. Payment by bank transfer within 7 days" />
        </label>
      </section>

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="submit" className={buttons.button} disabled={pending}>
          {pending ? "Saving…" : "Save and open"}
        </button>
      </div>
    </form>
  );
}

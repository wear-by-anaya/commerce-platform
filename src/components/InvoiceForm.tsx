"use client";

import { useActionState, useState } from "react";
import { createInvoiceAction, type FormState } from "@/app/invoices/actions";
import { formatTotal } from "@/lib/invoice";
import buttons from "./ui/Button.module.css";
import form from "./ui/Form.module.css";
import { Select } from "./ui/Select";
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
    <form action={action} className={form.stack}>
      <section className={form.panel}>
        <h2 className={form.title}>Details</h2>
        <div className={`${form.grid} ${form.grid3}`}>
          <Select name="kind" label="Type" options={["Invoice", "Estimate"]} defaultValue="Invoice" />
          <label className={form.field}>
            <span className={form.label}>Date</span>
            <input className={form.control} type="date" name="date" defaultValue={today} required />
          </label>
          <Select name="currency" label="Currency" options={currencies} value={currency} onChange={setCurrency} />
        </div>
      </section>

      <section className={form.panel}>
        <h2 className={form.title}>Customer</h2>
        <div className={form.grid}>
          <label className={form.field}>
            <span className={form.label}>Bill to</span>
            <textarea className={form.control} name="billTo" rows={4} required placeholder={"Name\nAddress line\nCity, Country"} />
            <span className={form.hint}>One line per row: name, address, city, phone.</span>
          </label>
          {sameAddress ? (
            <div className={styles.same}>
              <label className={form.check}>
                <input type="checkbox" name="sameAddress" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                <span>Ship to the same address</span>
              </label>
            </div>
          ) : (
            <div className={form.field}>
              <label className={form.field}>
                <span className={form.label}>Ship to</span>
                <textarea className={form.control} name="shipTo" rows={4} />
              </label>
              <label className={form.check}>
                <input type="checkbox" name="sameAddress" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                <span>Ship to the same address</span>
              </label>
            </div>
          )}
        </div>
      </section>

      <section className={form.panel}>
        <h2 className={form.title}>Items</h2>
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
              <label className={form.field}>
                <span className={`${form.label} ${styles.mobileLabel}`}>Item or service</span>
                <input className={form.control} value={line.service} onChange={(e) => update(index, "service", e.target.value)} maxLength={500} />
              </label>
              <label className={form.field}>
                <span className={`${form.label} ${styles.mobileLabel}`}>Description</span>
                <input className={form.control} value={line.description} onChange={(e) => update(index, "description", e.target.value)} maxLength={500} />
              </label>
              <label className={form.field}>
                <span className={`${form.label} ${styles.mobileLabel}`}>Qty</span>
                <input className={form.control} type="number" inputMode="decimal" min="0" step="any" value={line.quantity} onChange={(e) => update(index, "quantity", e.target.value)} />
              </label>
              <label className={form.field}>
                <span className={`${form.label} ${styles.mobileLabel}`}>Rate</span>
                <input className={form.control} type="number" inputMode="decimal" min="0" step="any" value={line.rate} onChange={(e) => update(index, "rate", e.target.value)} />
              </label>
              <p className={styles.amount}>{formatTotal(amount(line), currency)}</p>
              <button
                type="button"
                className={`${form.iconButton} ${styles.remove}`}
                onClick={() => setLines((all) => (all.length > 1 ? all.filter((_, i) => i !== index) : [emptyLine()]))}
                aria-label={`Remove line ${index + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        <div>
          <button type="button" className={buttons.secondary} onClick={() => setLines((all) => [...all, emptyLine()])}>
            Add line
          </button>
        </div>
        <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      </section>

      <section className={form.panel}>
        <h2 className={form.title}>Totals</h2>
        <div className={styles.totalsGrid}>
          <div className={form.stack}>
            <div className={form.grid}>
              <label className={form.field}>
                <span className={form.label}>Discount %</span>
                <input className={form.control} type="number" inputMode="decimal" name="discountPercent" min="0" max="100" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </label>
              <label className={form.field}>
                <span className={form.label}>Shipping</span>
                <input className={form.control} type="number" inputMode="decimal" name="shipping" min="0" step="any" value={shipping} onChange={(e) => setShipping(e.target.value)} />
              </label>
            </div>
            <label className={form.field}>
              <span className={form.label}>Note on the invoice (optional)</span>
              <textarea className={form.control} name="notes" rows={2} maxLength={500} placeholder="e.g. Payment by bank transfer within 7 days" />
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
      </section>

      {state.error ? (
        <p className={form.error} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className={form.actions}>
        <button type="submit" className={buttons.button} disabled={pending}>
          {pending ? "Saving…" : "Save and open"}
        </button>
      </div>
    </form>
  );
}

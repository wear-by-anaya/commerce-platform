import { db } from "@/lib/db";
import { invoiceTotals, type DocumentKind, type InvoiceData, type InvoiceLine } from "@/lib/invoice";
import { requireUser } from "@/lib/session";

export const CURRENCIES = ["PKR", "GBP", "USD", "EUR", "AED", "SAR", "CAD", "AUD"] as const;

export type ManualInvoiceInput = {
  kind: DocumentKind;
  date: string; // YYYY-MM-DD
  billTo: string[];
  shipTo: string[];
  currency: string;
  lines: Omit<InvoiceLine, "date">[];
  discountPercent: number;
  shipping: number;
  notes: string;
};

type Row = {
  id: number;
  number: string;
  kind: DocumentKind;
  invoice_date: string;
  bill_to: string;
  ship_to: string;
  currency: string;
  lines: Omit<InvoiceLine, "date">[];
  discount_percent: string;
  shipping: string;
  notes: string;
};

/** "2026-10-31" -> "31/10/2026", the same date style as order invoices. */
export function displayDate(isoDay: string) {
  const [y, m, d] = isoDay.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

function toInvoice(row: Row): InvoiceData & { notes: string } {
  const day = typeof row.invoice_date === "string" ? row.invoice_date : new Date(row.invoice_date).toISOString();
  const date = displayDate(day);
  return {
    kind: row.kind,
    number: row.number,
    date,
    billTo: toLines(row.bill_to),
    shipTo: toLines(row.ship_to),
    lines: row.lines.map((line) => ({ ...line, date })),
    discountPercent: Number(row.discount_percent),
    shipping: Number(row.shipping),
    currency: row.currency,
    notes: row.notes,
  };
}

/** Checks a submitted form; returns an error message for the person filling it in, or null. */
export function validateInvoice(input: ManualInvoiceInput): string | null {
  if (input.kind !== "Invoice" && input.kind !== "Estimate") return "Choose Invoice or Estimate.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date))) return "Enter a valid date.";
  if (!input.billTo.length) return "Enter who the invoice is for.";
  if (!(CURRENCIES as readonly string[]).includes(input.currency)) return "Choose a currency from the list.";
  if (!input.lines.length) return "Add at least one line.";
  if (input.lines.length > 50) return "An invoice can have up to 50 lines.";
  for (const line of input.lines) {
    if (!line.service.trim()) return "Every line needs an item or service.";
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return "Quantities must be more than 0.";
    if (!Number.isFinite(line.rate) || line.rate < 0) return "Rates can't be negative.";
  }
  if (!Number.isFinite(input.discountPercent) || input.discountPercent < 0 || input.discountPercent > 100) {
    return "Discount must be between 0 and 100%.";
  }
  if (!Number.isFinite(input.shipping) || input.shipping < 0) return "Shipping can't be negative.";
  const tooLong = [...input.billTo, ...input.shipTo, input.notes, ...input.lines.flatMap((l) => [l.service, l.description])]
    .some((text) => text.length > 500);
  if (tooLong) return "One of the texts is too long (500 characters at most).";
  return null;
}

export async function createManualInvoice(input: ManualInvoiceInput) {
  const user = await requireUser();
  const sql = await db();
  const prefix = input.kind === "Estimate" ? "EST-" : "INV-";
  const rows = (await sql`
    WITH n AS (SELECT nextval(pg_get_serial_sequence('manual_invoices', 'id')) AS id)
    INSERT INTO manual_invoices (id, number, kind, invoice_date, bill_to, ship_to, currency, lines, discount_percent, shipping, notes, created_by)
    SELECT n.id, ${prefix} || lpad(n.id::text, 4, '0'), ${input.kind}, ${input.date}, ${input.billTo.join("\n")},
      ${input.shipTo.join("\n")}, ${input.currency}, ${JSON.stringify(input.lines)}::jsonb, ${input.discountPercent},
      ${input.shipping}, ${input.notes}, ${user.email ?? ""}
    FROM n
    RETURNING id`) as { id: number }[];
  return rows[0].id;
}

export async function getManualInvoice(id: number) {
  await requireUser();
  const sql = await db();
  const rows = (await sql`SELECT * FROM manual_invoices WHERE id = ${id}`) as Row[];
  return rows[0] ? toInvoice(rows[0]) : null;
}

export async function listManualInvoices() {
  await requireUser();
  const sql = await db();
  const rows = (await sql`SELECT * FROM manual_invoices ORDER BY id DESC LIMIT 100`) as Row[];
  return rows.map((row) => {
    const invoice = toInvoice(row);
    return { id: row.id, invoice, total: invoiceTotals(invoice).total };
  });
}

export async function deleteManualInvoice(id: number) {
  await requireUser();
  const sql = await db();
  await sql`DELETE FROM manual_invoices WHERE id = ${id}`;
}

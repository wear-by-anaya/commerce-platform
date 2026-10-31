/** Seller details printed on documents. Public business details only. */
export const SELLER = {
  "name": "Wear by Anaya",
  "legal": "Wear By Anaya Ltd",
  "line1": "Shop # GF 30A, City Tower, Main Boulevard, Gulberg II",
  "line2": "Lahore, Pakistan",
  "phone": "+92 309 4488589",
  "email": "info@wearbyanaya.com",
  "website": "https://wearbyanaya.com"
} as const;

export const INVOICE_LOGO = {"src":"/brand-logo.svg","width":398,"height":168,"cssH":64} as const;

export type DocumentKind = "Invoice" | "Estimate";

export type InvoiceLine = {
  date: string;
  service: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceData = {
  kind: DocumentKind;
  number: string;
  date: string;
  billTo: string[];
  shipTo: string[];
  lines: InvoiceLine[];
  discountPercent: number;
  /** Fixed discount from the order; used instead of discountPercent when set. */
  discountAmount?: number;
  shipping?: number;
  currency: string;
  /** Short note printed under the totals. */
  notes?: string;
};

export function lineAmount(line: InvoiceLine) {
  return line.quantity * line.rate;
}

export function invoiceTotals(invoice: InvoiceData) {
  const subtotal = invoice.lines.reduce((sum, line) => sum + lineAmount(line), 0);
  const discount = invoice.discountAmount ?? (subtotal * invoice.discountPercent) / 100;
  const shipping = invoice.shipping ?? 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

export function formatAmount(value: number) {
  return value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTotal(value: number, currency: InvoiceData["currency"]) {
  const symbol = currency === "PKR" ? "Rs " : currency === "GBP" ? "£" : currency + " ";
  return symbol + formatAmount(value);
}

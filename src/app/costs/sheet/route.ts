import { productCostSheet } from "@/lib/profit";
import { STORE_SLUG } from "@/lib/config";

const cell = (value: string | number) => {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Product costs as a CSV that opens in Excel: fill "Own cost (PKR)", save as CSV, upload on the Costs page. */
export async function GET() {
  const rows = await productCostSheet();
  const lines = [
    ["SKU", "Brand", "Product", "Own cost (PKR)", "Cost used now (PKR)", "Based on"],
    ...rows.map((r) => [r.sku, r.brand, r.title, r.basis === "own cost" ? r.cost : "", Math.round(r.cost), r.basis]),
  ].map((row) => row.map(cell).join(","));
  const day = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${STORE_SLUG}-product-costs-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}

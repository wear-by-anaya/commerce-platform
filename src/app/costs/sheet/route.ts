import { STORE_SLUG } from "@/lib/config";
import { productCostSheet } from "@/lib/profit";
import { limitFor } from "@/lib/ratelimit";

const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Product costs as a CSV that opens in Excel: fill the "Own" columns, save as CSV, upload on the Costs page. */
export async function GET() {
  const limited = await limitFor("download");
  if (limited) return new Response(limited, { status: 429, headers: { "content-type": "text/plain; charset=utf-8" } });
  const rows = await productCostSheet();
  const lines = [
    ["SKU", "Brand", "Product", "Weight (kg)", "Own cost (PKR)", "Cost used now (PKR)", "Cost based on", "Own shipping (PKR)"],
    ...rows.map((r) => [
      r.sku,
      r.brand,
      r.title,
      r.weightKg ? Math.round(r.weightKg * 1000) / 1000 : "",
      r.ownCost,
      Math.round(r.costUsed),
      r.basis,
      r.ownShipping,
    ]),
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

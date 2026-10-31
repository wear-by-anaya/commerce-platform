"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { COST_CURRENCIES, EVERY } from "@/lib/profit";
import { requireUser } from "@/lib/session";

export type ActionState = { message: string | null; error: boolean };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const amount = (value: string) => (value === "" ? NaN : Number(value.replace(/,/g, "")));

export async function saveBrandDiscountAction(form: FormData) {
  await requireUser();
  const brand = text(form, "brand").slice(0, 120);
  const percent = amount(text(form, "percent"));
  if (!brand || !Number.isFinite(percent) || percent < 0 || percent > 100) return;
  const sql = await db();
  await sql`INSERT INTO brand_discounts (brand, percent) VALUES (${brand}, ${percent})
    ON CONFLICT (brand) DO UPDATE SET percent = EXCLUDED.percent`;
  revalidatePath("/costs");
}

export async function deleteBrandDiscountAction(form: FormData) {
  await requireUser();
  const sql = await db();
  await sql`DELETE FROM brand_discounts WHERE brand = ${text(form, "brand")}`;
  revalidatePath("/costs");
}

export async function addRunningCostAction(form: FormData) {
  await requireUser();
  const name = text(form, "name").slice(0, 120);
  const value = amount(text(form, "amount"));
  const currency = text(form, "currency");
  const every = text(form, "every");
  if (!name || !Number.isFinite(value) || value < 0) return;
  if (!(COST_CURRENCIES as readonly string[]).includes(currency) || !(EVERY as readonly string[]).includes(every)) return;
  const sql = await db();
  await sql`INSERT INTO running_costs (name, amount, currency, every) VALUES (${name}, ${value}, ${currency}, ${every})`;
  revalidatePath("/costs");
}

export async function deleteRunningCostAction(form: FormData) {
  await requireUser();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const sql = await db();
  await sql`DELETE FROM running_costs WHERE id = ${id}`;
  revalidatePath("/costs");
}

export async function saveOrderCostAction(form: FormData) {
  await requireUser();
  const orderId = text(form, "orderId");
  const shipping = amount(text(form, "shipping") || "0");
  const other = amount(text(form, "other") || "0");
  if (!/^\d+$/.test(orderId) || !Number.isFinite(shipping) || !Number.isFinite(other) || shipping < 0 || other < 0) return;
  const sql = await db();
  await sql`INSERT INTO order_costs (order_id, shipping_cost, other_cost) VALUES (${orderId}, ${shipping}, ${other})
    ON CONFLICT (order_id) DO UPDATE SET shipping_cost = EXCLUDED.shipping_cost, other_cost = EXCLUDED.other_cost, updated_at = now()`;
  revalidatePath("/profit");
}

/** Splits one CSV line, honouring quotes ("a, b" stays one field). */
function csvFields(line: string) {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";") {
      out.push(field.trim());
      field = "";
    } else field += ch;
  }
  out.push(field.trim());
  return out;
}

/**
 * Reads the sheet from "Download sheet" (saved as CSV from Excel). Uses the SKU and "Own cost" columns:
 * a number saves that cost, an empty cell removes the own cost so the brand-price rule applies again.
 */
export async function uploadProductCostsAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose the CSV file first.", error: true };
  if (file.size > 2_000_000) return { message: "The file is too big (2 MB at most).", error: true };
  const lines = (await file.text()).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const header = csvFields(lines[0] ?? "").map((h) => h.toLowerCase());
  const skuCol = header.findIndex((h) => h === "sku");
  const costCol = header.findIndex((h) => h.startsWith("own cost"));
  if (skuCol < 0 || costCol < 0) {
    return { message: 'The file needs the columns "SKU" and "Own cost (PKR)". Start from Download sheet.', error: true };
  }
  const set: { sku: string; cost: number }[] = [];
  const clear: string[] = [];
  const bad: number[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = csvFields(line);
    const sku = (cells[skuCol] ?? "").slice(0, 120);
    const raw = cells[costCol] ?? "";
    if (!sku) return;
    if (raw === "") return clear.push(sku);
    const cost = amount(raw);
    if (!Number.isFinite(cost) || cost < 0) return bad.push(i + 2);
    set.push({ sku, cost });
  });
  if (bad.length) return { message: `Nothing saved: rows ${bad.slice(0, 10).join(", ")} have a cost that is not a number.`, error: true };
  const sql = await db();
  const queries = [
    ...set.map((r) => sql`INSERT INTO product_costs (sku, cost) VALUES (${r.sku}, ${r.cost})
      ON CONFLICT (sku) DO UPDATE SET cost = EXCLUDED.cost, updated_at = now()`),
    ...(clear.length ? [sql`DELETE FROM product_costs WHERE sku = ANY(${clear})`] : []),
  ];
  await sql.transaction(queries);
  revalidatePath("/costs");
  revalidatePath("/profit");
  return { message: `Saved ${set.length} own costs; ${clear.length} back to the brand-price rule.`, error: false };
}

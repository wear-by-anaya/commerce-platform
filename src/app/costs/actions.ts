"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { COST_CURRENCIES, EVERY, EXPENSE_CATEGORIES } from "@/lib/profit";
import { requireUser } from "@/lib/session";

export type ActionState = { message: string | null; error: boolean };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const amount = (value: string) => (value === "" ? NaN : Number(value.replace(/,/g, "")));
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

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

/** Shipping per kg for Pakistan and abroad (PKR); empty = 0 (not set). */
export async function saveShippingRatesAction(form: FormData) {
  await requireUser();
  const pk = amount(text(form, "pakistan") || "0");
  const abroad = amount(text(form, "abroad") || "0");
  if (!Number.isFinite(pk) || !Number.isFinite(abroad) || pk < 0 || abroad < 0) return;
  const sql = await db();
  await sql.transaction([
    sql`INSERT INTO settings (key, value) VALUES ('ship_rate_pk', ${String(pk)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    sql`INSERT INTO settings (key, value) VALUES ('ship_rate_abroad', ${String(abroad)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  ]);
  revalidatePath("/costs");
  revalidatePath("/profit");
}

export async function addExpenseAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const name = text(form, "name").slice(0, 120);
  const value = amount(text(form, "amount"));
  const currency = text(form, "currency");
  const every = text(form, "every");
  const category = text(form, "category");
  const paidOn = text(form, "paidOn");
  const note = text(form, "note").slice(0, 500);
  if (!name) return { message: "Enter what the expense is for.", error: true };
  if (!Number.isFinite(value) || value < 0) return { message: "Enter the amount as a number.", error: true };
  if (!(COST_CURRENCIES as readonly string[]).includes(currency)) return { message: "Choose a currency.", error: true };
  if (!(EVERY as readonly string[]).includes(every)) return { message: "Choose how often it is paid.", error: true };
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) return { message: "Choose a category.", error: true };
  if (paidOn && !isDay(paidOn)) return { message: "Enter a valid date.", error: true };
  const sql = await db();
  await sql`INSERT INTO running_costs (name, amount, currency, every, category, paid_on, note)
    VALUES (${name}, ${value}, ${currency}, ${every}, ${category}, ${paidOn || null}, ${note})`;
  revalidatePath("/expenses");
  revalidatePath("/profit");
  return { message: `Added ${name}.`, error: false };
}

export async function deleteExpenseAction(form: FormData) {
  await requireUser();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const sql = await db();
  await sql`DELETE FROM running_costs WHERE id = ${id}`;
  revalidatePath("/expenses");
  revalidatePath("/profit");
}

/** Other costs for one order (packing, courier extras); shipping comes from the products. */
export async function saveOrderCostAction(form: FormData) {
  await requireUser();
  const orderId = text(form, "orderId");
  const other = amount(text(form, "other") || "0");
  if (!/^\d+$/.test(orderId) || !Number.isFinite(other) || other < 0) return;
  const sql = await db();
  await sql`INSERT INTO order_costs (order_id, other_cost) VALUES (${orderId}, ${other})
    ON CONFLICT (order_id) DO UPDATE SET other_cost = EXCLUDED.other_cost, updated_at = now()`;
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
 * Reads the sheet from "Download sheet" (saved as CSV from Excel): SKU, "Own cost (PKR)" and "Own shipping (PKR)".
 * A number saves it; an empty cell goes back to the rule (brand discount, or weight x rate).
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
  const shipCol = header.findIndex((h) => h.startsWith("own shipping"));
  if (skuCol < 0 || (costCol < 0 && shipCol < 0)) {
    return { message: 'The file needs "SKU" and "Own cost (PKR)" or "Own shipping (PKR)". Start from Download sheet.', error: true };
  }
  const parse = (raw: string | undefined) => (raw === undefined || raw === "" ? null : amount(raw));
  const rows: { sku: string; cost: number | null; shipping: number | null }[] = [];
  const bad: number[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = csvFields(line);
    const sku = (cells[skuCol] ?? "").slice(0, 120);
    if (!sku) return;
    const cost = costCol >= 0 ? parse(cells[costCol]) : null;
    const shipping = shipCol >= 0 ? parse(cells[shipCol]) : null;
    if ([cost, shipping].some((v) => v !== null && (!Number.isFinite(v) || v < 0))) return bad.push(i + 2);
    rows.push({ sku, cost, shipping });
  });
  if (bad.length) return { message: `Nothing saved: rows ${bad.slice(0, 10).join(", ")} have a value that is not a number.`, error: true };
  const keep = rows.filter((r) => r.cost !== null || r.shipping !== null);
  const clear = rows.filter((r) => r.cost === null && r.shipping === null).map((r) => r.sku);
  const sql = await db();
  await sql.transaction([
    ...keep.map((r) => sql`INSERT INTO product_costs (sku, cost, shipping) VALUES (${r.sku}, ${r.cost}, ${r.shipping})
      ON CONFLICT (sku) DO UPDATE SET cost = EXCLUDED.cost, shipping = EXCLUDED.shipping, updated_at = now()`),
    ...(clear.length ? [sql`DELETE FROM product_costs WHERE sku = ANY(${clear})`] : []),
  ]);
  revalidatePath("/costs");
  revalidatePath("/profit");
  return { message: `Saved ${keep.length} products; ${clear.length} back to the rules.`, error: false };
}

/** Marks a Shopify or Google update as reviewed, with what we changed (or unmarks it). */
export async function reviewUpdateAction(form: FormData) {
  const user = await requireUser();
  const key = text(form, "key").slice(0, 600);
  if (!key) return;
  const sql = await db();
  if (form.get("reviewed")) {
    const note = text(form, "note").slice(0, 500);
    await sql`INSERT INTO update_reviews (item_key, reviewed_by, note) VALUES (${key}, ${user.email ?? ""}, ${note})
      ON CONFLICT (item_key) DO UPDATE SET note = EXCLUDED.note, reviewed_by = EXCLUDED.reviewed_by, reviewed_at = now()`;
  } else {
    await sql`DELETE FROM update_reviews WHERE item_key = ${key}`;
  }
  revalidatePath("/updates");
  revalidatePath("/");
}

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { shopifyQuery } from "@/lib/shopify/client";
import { searchText, type Cursor, type PageInfo } from "@/lib/shopify/orders";

/** Supplier discount when a brand has no row of its own (default from the Afrozeh estimate, 31 Oct: brand price less 15%). */
export const DEFAULT_DISCOUNT = 15;
export const COST_CURRENCIES = ["PKR", "GBP", "USD"] as const;
export const EVERY = ["month", "year", "once"] as const;
export const EXPENSE_CATEGORIES = ["Shopify", "Apps", "AI tools", "Google", "Domains and hosting", "Marketing", "Staff", "Other"] as const;

type Money = { shopMoney: { amount: string; currencyCode: string } };
type Weight = { unit: "KILOGRAMS" | "GRAMS" | "POUNDS" | "OUNCES"; value: number };

type ProfitLineNode = {
  sku: string | null;
  vendor: string | null;
  title: string;
  currentQuantity: number;
  variant: { price: string; inventoryItem: { measurement: { weight: Weight | null } | null } | null } | null;
  originalUnitPriceSet: Money;
};

type ProfitOrder = {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  currentTotalPriceSet: Money;
  shippingAddress: { countryCodeV2: string | null } | null;
  lineItems: { nodes: ProfitLineNode[] };
};

// 25 orders x 20 lines keeps the query under Shopify's cost limit.
const QUERY = `query ProfitOrders($first: Int, $last: Int, $after: String, $before: String, $query: String) {
  orders(first: $first, last: $last, after: $after, before: $before, query: $query, sortKey: CREATED_AT, reverse: true) {
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    nodes {
      id name createdAt cancelledAt
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      shippingAddress { countryCodeV2 }
      lineItems(first: 20) {
        nodes {
          sku vendor title currentQuantity
          variant { price inventoryItem { measurement { weight { unit value } } } }
          originalUnitPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }
  }
}`;

const KG: Record<Weight["unit"], number> = { KILOGRAMS: 1, GRAMS: 0.001, POUNDS: 0.45359237, OUNCES: 0.028349523 };

export type CostSettings = {
  discounts: Map<string, number>;
  productCosts: Map<string, { cost: number | null; shipping: number | null }>;
  orderOther: Map<string, number>;
  rates: { pakistan: number; abroad: number };
};

export async function loadCostSettings(): Promise<CostSettings> {
  await requireUser();
  const sql = await db();
  const [discounts, products, orders, settings] = await Promise.all([
    sql`SELECT brand, percent FROM brand_discounts`,
    sql`SELECT sku, cost, shipping FROM product_costs`,
    sql`SELECT order_id, other_cost FROM order_costs`,
    sql`SELECT key, value FROM settings WHERE key IN ('ship_rate_pk', 'ship_rate_abroad')`,
  ]);
  const setting = (key: string) => Number(settings.find((r) => r.key === key)?.value ?? 0) || 0;
  const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
  return {
    discounts: new Map(discounts.map((r) => [String(r.brand).toLowerCase(), Number(r.percent)])),
    productCosts: new Map(products.map((r) => [String(r.sku), { cost: num(r.cost), shipping: num(r.shipping) }])),
    orderOther: new Map(orders.map((r) => [String(r.order_id), Number(r.other_cost)])),
    rates: { pakistan: setting("ship_rate_pk"), abroad: setting("ship_rate_abroad") },
  };
}

export type CostBasis = "own cost" | "brand price" | "estimate";
export type ShippingBasis = "own shipping" | "by weight" | "no weight" | "no rate";

export type ProfitLine = {
  sku: string;
  title: string;
  brand: string;
  quantity: number;
  unitCost: number;
  basis: CostBasis;
  unitShipping: number;
  shippingBasis: ShippingBasis;
};

export type ProfitRow = {
  orderId: string;
  name: string;
  date: string;
  country: string;
  revenue: number;
  productCost: number;
  shipping: number;
  other: number;
  profit: number;
  margin: number | null;
  lines: ProfitLine[];
};

const weightKg = (line: ProfitLineNode) => {
  const w = line.variant?.inventoryItem?.measurement?.weight;
  return w && w.value > 0 ? w.value * KG[w.unit] : 0;
};

/** Unit cost: own cost for the SKU if entered, else our store price (= brand regular price) less the brand discount. */
export function unitCost(line: ProfitLineNode, settings: CostSettings): { cost: number; basis: CostBasis } {
  const own = line.sku ? settings.productCosts.get(line.sku)?.cost : null;
  if (own !== null && own !== undefined) return { cost: own, basis: "own cost" };
  const pct = settings.discounts.get((line.vendor ?? "").toLowerCase()) ?? DEFAULT_DISCOUNT;
  // variant.price is the PKR base price; the order price can carry the abroad market adjustment.
  const base = line.variant ? Number(line.variant.price) : Number(line.originalUnitPriceSet.shopMoney.amount);
  return { cost: base * (1 - pct / 100), basis: line.variant ? "brand price" : "estimate" };
}

/** Unit shipping: own shipping for the SKU if entered, else weight x the per-kg rate for Pakistan or abroad. */
export function unitShipping(line: ProfitLineNode, country: string, settings: CostSettings): { cost: number; basis: ShippingBasis } {
  const own = line.sku ? settings.productCosts.get(line.sku)?.shipping : null;
  if (own !== null && own !== undefined) return { cost: own, basis: "own shipping" };
  const rate = country === "PK" ? settings.rates.pakistan : settings.rates.abroad;
  if (!rate) return { cost: 0, basis: "no rate" };
  const kg = weightKg(line);
  return kg ? { cost: kg * rate, basis: "by weight" } : { cost: 0, basis: "no weight" };
}

export const PROFIT_PAGE_SIZE = 25;

export async function profitByOrder(cursor: Cursor = {}, q?: string) {
  await requireUser();
  const page = cursor.before ? { last: PROFIT_PAGE_SIZE, before: cursor.before } : { first: PROFIT_PAGE_SIZE, after: cursor.after ?? null };
  const vars = { ...page, query: searchText(q) };
  const [{ data, errors }, settings] = await Promise.all([
    shopifyQuery<{ orders: { nodes: ProfitOrder[]; pageInfo: PageInfo } }>(QUERY, vars),
    loadCostSettings(),
  ]);
  const rows: ProfitRow[] = (data?.orders.nodes ?? [])
    .filter((order) => !order.cancelledAt)
    .map((order) => {
      const orderId = order.id.split("/").pop() ?? order.id;
      const country = order.shippingAddress?.countryCodeV2 ?? "";
      const lines = order.lineItems.nodes
        .filter((line) => line.currentQuantity > 0)
        .map((line) => {
          const { cost, basis } = unitCost(line, settings);
          const ship = unitShipping(line, country, settings);
          return {
            sku: line.sku ?? "",
            title: line.title,
            brand: line.vendor ?? "",
            quantity: line.currentQuantity,
            unitCost: cost,
            basis,
            unitShipping: ship.cost,
            shippingBasis: ship.basis,
          };
        });
      const revenue = Number(order.currentTotalPriceSet.shopMoney.amount);
      const productCost = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
      const shipping = lines.reduce((sum, l) => sum + l.unitShipping * l.quantity, 0);
      const other = settings.orderOther.get(orderId) ?? 0;
      const profit = revenue - productCost - shipping - other;
      return {
        orderId,
        name: order.name,
        date: order.createdAt,
        country,
        revenue,
        productCost,
        shipping,
        other,
        profit,
        margin: revenue > 0 ? profit / revenue : null,
        lines,
      };
    });
  const currency = data?.orders.nodes[0]?.currentTotalPriceSet.shopMoney.currencyCode ?? "PKR";
  return { rows, currency, rates: settings.rates, pageInfo: data?.orders.pageInfo ?? null, errors };
}

export type Expense = {
  id: number;
  name: string;
  category: string;
  amount: number;
  currency: string;
  every: string;
  paidOn: string | null;
  note: string;
};

/** Expenses with totals per currency: recurring per month, and one-off payments this month (Pakistan time). */
export async function expenses() {
  await requireUser();
  const sql = await db();
  const rows = await sql`SELECT id, name, category, amount, currency, every, paid_on::text AS paid_on, note
    FROM running_costs ORDER BY COALESCE(paid_on, created_at::date) DESC, id DESC`;
  const list: Expense[] = rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    category: String(r.category),
    amount: Number(r.amount),
    currency: String(r.currency),
    every: String(r.every),
    paidOn: r.paid_on ? String(r.paid_on) : null,
    note: String(r.note ?? ""),
  }));
  const month = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 7);
  const monthly = new Map<string, number>();
  const oneOffThisMonth = new Map<string, number>();
  for (const e of list) {
    const perMonth = e.every === "month" ? e.amount : e.every === "year" ? e.amount / 12 : 0;
    if (perMonth) monthly.set(e.currency, (monthly.get(e.currency) ?? 0) + perMonth);
    if (e.every === "once" && e.paidOn?.startsWith(month)) {
      oneOffThisMonth.set(e.currency, (oneOffThisMonth.get(e.currency) ?? 0) + e.amount);
    }
  }
  return { list, monthly, oneOffThisMonth };
}

export async function brandDiscounts() {
  await requireUser();
  const sql = await db();
  const rows = await sql`SELECT brand, percent FROM brand_discounts ORDER BY brand`;
  return rows.map((r) => ({ brand: String(r.brand), percent: Number(r.percent) }));
}

export async function shippingRates() {
  return (await loadCostSettings()).rates;
}

export type SheetRow = {
  sku: string;
  brand: string;
  title: string;
  ownCost: number | null;
  costUsed: number;
  basis: CostBasis;
  ownShipping: number | null;
  weightKg: number;
};

/** SKUs from recent orders plus every saved own cost, for the spreadsheet download. */
export async function productCostSheet(): Promise<SheetRow[]> {
  await requireUser();
  const [{ data }, settings] = await Promise.all([shopifyQuery<{ orders: { nodes: ProfitOrder[] } }>(QUERY, { first: 25 }), loadCostSettings()]);
  const rows = new Map<string, SheetRow>();
  for (const order of data?.orders.nodes ?? []) {
    for (const line of order.lineItems.nodes) {
      if (!line.sku || rows.has(line.sku)) continue;
      const own = settings.productCosts.get(line.sku);
      const { cost, basis } = unitCost(line, settings);
      rows.set(line.sku, {
        sku: line.sku,
        brand: line.vendor ?? "",
        title: line.title,
        ownCost: own?.cost ?? null,
        costUsed: cost,
        basis,
        ownShipping: own?.shipping ?? null,
        weightKg: weightKg(line),
      });
    }
  }
  for (const [sku, own] of settings.productCosts) {
    if (rows.has(sku)) continue;
    rows.set(sku, { sku, brand: "", title: "", ownCost: own.cost, costUsed: own.cost ?? 0, basis: "own cost", ownShipping: own.shipping, weightKg: 0 });
  }
  return [...rows.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.sku.localeCompare(b.sku));
}

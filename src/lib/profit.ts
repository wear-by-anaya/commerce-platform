import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { shopifyQuery } from "@/lib/shopify/client";

/** Supplier discount when a brand has no row of its own (user default, 31 Oct: brand price less 15%). */
export const DEFAULT_DISCOUNT = 15;
export const COST_CURRENCIES = ["PKR", "GBP", "USD"] as const;
export const EVERY = ["month", "year", "once"] as const;

type Money = { shopMoney: { amount: string; currencyCode: string } };

type ProfitOrder = {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  currentTotalPriceSet: Money;
  lineItems: {
    nodes: {
      sku: string | null;
      vendor: string | null;
      title: string;
      currentQuantity: number;
      variant: { price: string } | null;
      originalUnitPriceSet: Money;
    }[];
  };
};

// 25 orders x 20 lines keeps the query under Shopify's cost limit.
const QUERY = `query ProfitOrders {
  orders(first: 25, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id name createdAt cancelledAt
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 20) {
        nodes {
          sku vendor title currentQuantity
          variant { price }
          originalUnitPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }
  }
}`;

export type CostSettings = {
  discounts: Map<string, number>;
  productCosts: Map<string, number>;
  orderCosts: Map<string, { shipping: number; other: number }>;
};

export async function loadCostSettings(): Promise<CostSettings> {
  await requireUser();
  const sql = await db();
  const [discounts, products, orders] = await Promise.all([
    sql`SELECT brand, percent FROM brand_discounts`,
    sql`SELECT sku, cost FROM product_costs`,
    sql`SELECT order_id, shipping_cost, other_cost FROM order_costs`,
  ]);
  return {
    discounts: new Map(discounts.map((r) => [String(r.brand).toLowerCase(), Number(r.percent)])),
    productCosts: new Map(products.map((r) => [String(r.sku), Number(r.cost)])),
    orderCosts: new Map(orders.map((r) => [String(r.order_id), { shipping: Number(r.shipping_cost), other: Number(r.other_cost) }])),
  };
}

export type CostBasis = "own cost" | "brand price" | "estimate";

export type ProfitLine = { sku: string; title: string; brand: string; quantity: number; unitCost: number; basis: CostBasis };

export type ProfitRow = {
  orderId: string;
  name: string;
  date: string;
  revenue: number;
  productCost: number;
  shipping: number;
  other: number;
  profit: number;
  margin: number | null;
  lines: ProfitLine[];
};

/** Unit cost: own cost for the SKU if entered, else our store price (= brand regular price) less the brand discount. */
export function unitCost(
  line: { sku: string | null; vendor: string | null; variant: { price: string } | null; originalUnitPriceSet: Money },
  settings: CostSettings,
): { cost: number; basis: CostBasis } {
  const own = line.sku ? settings.productCosts.get(line.sku) : undefined;
  if (own !== undefined) return { cost: own, basis: "own cost" };
  const pct = settings.discounts.get((line.vendor ?? "").toLowerCase()) ?? DEFAULT_DISCOUNT;
  // variant.price is the PKR base price; the order price can carry the abroad market adjustment.
  const base = line.variant ? Number(line.variant.price) : Number(line.originalUnitPriceSet.shopMoney.amount);
  return { cost: base * (1 - pct / 100), basis: line.variant ? "brand price" : "estimate" };
}

export async function profitByOrder() {
  await requireUser();
  const [{ data, errors }, settings] = await Promise.all([shopifyQuery<{ orders: { nodes: ProfitOrder[] } }>(QUERY), loadCostSettings()]);
  const rows: ProfitRow[] = (data?.orders.nodes ?? [])
    .filter((order) => !order.cancelledAt)
    .map((order) => {
      const orderId = order.id.split("/").pop() ?? order.id;
      const lines = order.lineItems.nodes
        .filter((line) => line.currentQuantity > 0)
        .map((line) => {
          const { cost, basis } = unitCost(line, settings);
          return { sku: line.sku ?? "", title: line.title, brand: line.vendor ?? "", quantity: line.currentQuantity, unitCost: cost, basis };
        });
      const revenue = Number(order.currentTotalPriceSet.shopMoney.amount);
      const productCost = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
      const extra = settings.orderCosts.get(orderId) ?? { shipping: 0, other: 0 };
      const profit = revenue - productCost - extra.shipping - extra.other;
      return {
        orderId,
        name: order.name,
        date: order.createdAt,
        revenue,
        productCost,
        shipping: extra.shipping,
        other: extra.other,
        profit,
        margin: revenue > 0 ? profit / revenue : null,
        lines,
      };
    });
  const currency = data?.orders.nodes[0]?.currentTotalPriceSet.shopMoney.currencyCode ?? "PKR";
  return { rows, currency, errors };
}

export async function runningCosts() {
  await requireUser();
  const sql = await db();
  const rows = await sql`SELECT id, name, amount, currency, every FROM running_costs ORDER BY id`;
  const list = rows.map((r) => ({ id: Number(r.id), name: String(r.name), amount: Number(r.amount), currency: String(r.currency), every: String(r.every) }));
  // Monthly total per currency; one-off costs are listed but not spread over months.
  const monthly = new Map<string, number>();
  for (const cost of list) {
    const perMonth = cost.every === "month" ? cost.amount : cost.every === "year" ? cost.amount / 12 : 0;
    if (perMonth) monthly.set(cost.currency, (monthly.get(cost.currency) ?? 0) + perMonth);
  }
  return { list, monthly };
}

export async function brandDiscounts() {
  await requireUser();
  const sql = await db();
  const rows = await sql`SELECT brand, percent FROM brand_discounts ORDER BY brand`;
  return rows.map((r) => ({ brand: String(r.brand), percent: Number(r.percent) }));
}

/** SKUs from recent orders plus every saved own cost, for the spreadsheet download. */
export async function productCostSheet() {
  await requireUser();
  const [{ data }, settings] = await Promise.all([shopifyQuery<{ orders: { nodes: ProfitOrder[] } }>(QUERY), loadCostSettings()]);
  const rows = new Map<string, { sku: string; brand: string; title: string; cost: number; basis: CostBasis }>();
  for (const order of data?.orders.nodes ?? []) {
    for (const line of order.lineItems.nodes) {
      if (!line.sku || rows.has(line.sku)) continue;
      const { cost, basis } = unitCost(line, settings);
      rows.set(line.sku, { sku: line.sku, brand: line.vendor ?? "", title: line.title, cost, basis });
    }
  }
  for (const [sku, cost] of settings.productCosts) {
    if (!rows.has(sku)) rows.set(sku, { sku, brand: "", title: "", cost, basis: "own cost" });
  }
  return [...rows.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.sku.localeCompare(b.sku));
}

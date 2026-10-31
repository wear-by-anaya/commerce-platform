import { shopifyQuery } from "./client";
import type { InvoiceData } from "@/lib/invoice";

type Money = { presentmentMoney: { amount: string; currencyCode: string } };

export type OrderSummary = {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string;
  paymentGatewayNames: string[];
  totalPriceSet: Money;
  shippingAddress: { name: string | null; city: string | null; country: string | null } | null;
};

const LIST_QUERY = `query Orders($first: Int!) {
  orders(first: $first, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id name createdAt cancelledAt displayFinancialStatus displayFulfillmentStatus paymentGatewayNames
      totalPriceSet { presentmentMoney { amount currencyCode } }
      shippingAddress { name city country }
    }
  }
}`;

const STATS_QUERY = `query Stats($recent: String!) {
  recent: orders(first: 250, query: $recent) {
    nodes { createdAt cancelledAt currentTotalPriceSet { shopMoney { amount currencyCode } } }
  }
  open: orders(first: 250, query: "status:open AND fulfillment_status:unfulfilled") {
    nodes { id cancelledAt }
  }
}`;

type StatsResult = {
  recent: { nodes: { createdAt: string; cancelledAt: string | null; currentTotalPriceSet: { shopMoney: { amount: string; currencyCode: string } } }[] };
  open: { nodes: { id: string; cancelledAt: string | null }[] };
};

/** Dashboard figures in the shop's own currency; cancelled orders are left out. */
export async function orderStats() {
  const karachiDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const today = karachiDay(new Date());
  const weekStart = karachiDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const { data, errors } = await shopifyQuery<StatsResult>(STATS_QUERY, { recent: `created_at:>=${weekStart}` });
  const live = (data?.recent.nodes ?? []).filter((o) => !o.cancelledAt);
  const todays = live.filter((o) => karachiDay(new Date(o.createdAt)) === today);
  const sum = (list: typeof live) => list.reduce((total, o) => total + Number(o.currentTotalPriceSet.shopMoney.amount), 0);
  return {
    currency: data?.recent.nodes[0]?.currentTotalPriceSet.shopMoney.currencyCode ?? "PKR",
    ordersToday: todays.length,
    revenueToday: sum(todays),
    ordersWeek: live.length,
    revenueWeek: sum(live),
    openOrders: (data?.open.nodes ?? []).filter((o) => !o.cancelledAt).length,
    errors,
  };
}

export async function listOrders(first = 50) {
  const { data, errors } = await shopifyQuery<{ orders: { nodes: OrderSummary[] } }>(LIST_QUERY, { first });
  return { orders: data?.orders.nodes ?? [], errors };
}

type OrderDetail = {
  name: string;
  createdAt: string;
  presentmentCurrencyCode: string;
  billingAddress: { formatted: string[] } | null;
  shippingAddress: { formatted: string[] } | null;
  subtotalPriceSet: Money;
  totalDiscountsSet: Money;
  totalShippingPriceSet: Money;
  totalPriceSet: Money;
  lineItems: {
    nodes: {
      title: string;
      vendor: string | null;
      variantTitle: string | null;
      quantity: number;
      customAttributes: { key: string; value: string | null }[];
      originalUnitPriceSet: Money;
    }[];
  };
};

const ORDER_QUERY = `query Order($id: ID!) {
  order(id: $id) {
    name createdAt presentmentCurrencyCode
    billingAddress { formatted(withName: true) }
    shippingAddress { formatted(withName: true) }
    subtotalPriceSet { presentmentMoney { amount currencyCode } }
    totalDiscountsSet { presentmentMoney { amount currencyCode } }
    totalShippingPriceSet { presentmentMoney { amount currencyCode } }
    totalPriceSet { presentmentMoney { amount currencyCode } }
    lineItems(first: 100) {
      nodes {
        title vendor variantTitle quantity
        customAttributes { key value }
        originalUnitPriceSet { presentmentMoney { amount currencyCode } }
      }
    }
  }
}`;

const amount = (m: Money) => Number(m.presentmentMoney.amount);

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" });
}

/** Builds an invoice from a Shopify order, in the currency the customer paid. */
export async function orderInvoice(orderId: string) {
  const { data, errors } = await shopifyQuery<{ order: OrderDetail | null }>(ORDER_QUERY, {
    id: `gid://shopify/Order/${orderId}`,
  });
  const order = data?.order;
  if (!order) return { invoice: null, errors };
  const date = formatDate(order.createdAt);
  const invoice: InvoiceData = {
    kind: "Invoice",
    number: order.name,
    date,
    billTo: order.billingAddress?.formatted ?? [],
    shipTo: order.shippingAddress?.formatted ?? [],
    lines: order.lineItems.nodes.map((line) => ({
      date,
      service: line.title,
      description: [
        line.vendor,
        line.variantTitle,
        ...line.customAttributes.filter((a) => a.value && !a.key.startsWith("_")).map((a) => `${a.key}: ${a.value}`),
      ]
        .filter(Boolean)
        .join(", "),
      quantity: line.quantity,
      rate: amount(line.originalUnitPriceSet),
    })),
    discountPercent: 0,
    discountAmount: amount(order.totalDiscountsSet),
    shipping: amount(order.totalShippingPriceSet),
    currency: order.presentmentCurrencyCode,
  };
  return { invoice, errors };
}

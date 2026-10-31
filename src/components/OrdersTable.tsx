import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { formatTotal } from "@/lib/invoice";
import { isShopifyConnected } from "@/lib/shopify/client";
import { formatDate, listOrders, type OrderSummary } from "@/lib/shopify/orders";
import styles from "./OrdersTable.module.css";

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" && value.length < 400 ? value : undefined);

/**
 * Orders from Shopify, newest first, or an empty state when the store is not connected.
 * With `path`, shows page controls; the page lives in the URL (?after= / ?before= / ?p=) so it can be shared and reloaded.
 */
export async function RecentOrders({
  first = 25,
  path,
  params = {},
  prefix = "",
}: {
  first?: number;
  path?: string;
  params?: Params;
  prefix?: string;
}) {
  await connection();
  if (!isShopifyConnected()) {
    return (
      <EmptyState
        title="Shopify is not connected"
        description="Add SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in Vercel, then redeploy."
      />
    );
  }
  const after = path ? one(params[`${prefix}after`]) : undefined;
  const before = path ? one(params[`${prefix}before`]) : undefined;
  const page = pageFrom(params[`${prefix}p`]);
  const q = path ? one(params[`${prefix}q`]) : undefined;
  const { orders, pageInfo, errors } = await listOrders(first, { after, before }, q);
  const keys = { [`${prefix}after`]: null, [`${prefix}before`]: null };
  const prevHref =
    path && pageInfo?.hasPreviousPage && pageInfo.startCursor && page > 1
      ? withParams(path, params, { ...keys, [`${prefix}before`]: pageInfo.startCursor, [`${prefix}p`]: page > 2 ? String(page - 1) : null })
      : null;
  const nextHref =
    path && pageInfo?.hasNextPage && pageInfo.endCursor
      ? withParams(path, params, { ...keys, [`${prefix}after`]: pageInfo.endCursor, [`${prefix}p`]: String(page + 1) })
      : null;
  const from = (page - 1) * first + 1;
  return (
    <>
      {errors.length ? <p className={styles.notice}>Some order details could not be read: {errors[0]}</p> : null}
      {orders.length ? (
        <>
          <OrdersTable orders={orders} />
          <Pagination prevHref={prevHref} nextHref={nextHref} label={`Orders ${from}–${from + orders.length - 1}`} />
        </>
      ) : (
        q ? (
          <EmptyState title="No orders match" description={`Nothing found for "${q}". Try an order number, a name or an email.`} />
        ) : (
          <EmptyState title="No orders yet" description="New orders show here as soon as they are placed." />
        )
      )}
    </>
  );
}

const label = (value: string | null) => (value ?? "").toLowerCase().replace(/_/g, " ");

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Status</th>
            <th className={styles.num}>Total</th>
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const id = order.id.split("/").pop();
            const total = order.totalPriceSet.presentmentMoney;
            const place = [order.shippingAddress?.city, order.shippingAddress?.country].filter(Boolean).join(", ");
            return (
              <tr key={order.id}>
                <td data-label="Order">{order.name}</td>
                <td data-label="Date">{formatDate(order.createdAt)}</td>
                <td data-label="Customer">
                  {order.shippingAddress?.name ?? "-"}
                  {place ? <span className={styles.sub}>{place}</span> : null}
                </td>
                <td data-label="Payment">
                  {order.paymentGatewayNames.join(", ") || "-"}
                  <span className={styles.sub}>{label(order.displayFinancialStatus)}</span>
                </td>
                <td data-label="Status">
                  {order.cancelledAt ? (
                    <Badge tone="warning">cancelled</Badge>
                  ) : (
                    <Badge>{label(order.displayFulfillmentStatus)}</Badge>
                  )}
                </td>
                <td data-label="Total" className={styles.num}>{formatTotal(Number(total.amount), total.currencyCode)}</td>
                <td data-label="Invoice">
                  <Link href={`/invoices/${id}`}>Open</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

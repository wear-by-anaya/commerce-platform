import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatTotal } from "@/lib/invoice";
import { isShopifyConnected } from "@/lib/shopify/client";
import { formatDate, listOrders, type OrderSummary } from "@/lib/shopify/orders";
import styles from "./OrdersTable.module.css";

/** Latest orders from Shopify, or an empty state when the store is not connected. */
export async function RecentOrders() {
  await connection();
  if (!isShopifyConnected()) {
    return (
      <EmptyState
        title="Shopify is not connected"
        description="Add SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in Vercel, then redeploy."
      />
    );
  }
  const { orders, errors } = await listOrders();
  return (
    <>
      {errors.length ? <p className={styles.notice}>Some order details could not be read: {errors[0]}</p> : null}
      {orders.length ? (
        <OrdersTable orders={orders} />
      ) : (
        <EmptyState title="No orders yet" description="New orders show here as soon as they are placed." />
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
                <td>{order.name}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  {order.shippingAddress?.name ?? "-"}
                  {place ? <span className={styles.sub}>{place}</span> : null}
                </td>
                <td>
                  {order.paymentGatewayNames.join(", ") || "-"}
                  <span className={styles.sub}>{label(order.displayFinancialStatus)}</span>
                </td>
                <td>
                  {order.cancelledAt ? (
                    <Badge tone="warning">cancelled</Badge>
                  ) : (
                    <Badge>{label(order.displayFulfillmentStatus)}</Badge>
                  )}
                </td>
                <td className={styles.num}>{formatTotal(Number(total.amount), total.currencyCode)}</td>
                <td>
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

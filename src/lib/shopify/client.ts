/**
 * Shopify Admin placeholder.
 * No live Admin API calls, scopes, apps, or webhooks in this boilerplate.
 */
export type ShopifyConnectionStatus = "NOT_CONNECTED";

export interface ShopifyClientPlaceholder {
  readonly status: ShopifyConnectionStatus;
}

export function getShopifyClient(): ShopifyClientPlaceholder {
  return { status: "NOT_CONNECTED" };
}

import { isShopifyConnected } from "@/lib/shopify/client";

/** Which services have their settings in place. Names only; values are never read out. */
export function connectionStatus() {
  return {
    shopify: isShopifyConnected(),
    database: Boolean(process.env.DATABASE_URL),
    login: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.ALLOWED_EMAILS),
  };
}

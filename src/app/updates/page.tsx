import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { UpdatesList } from "@/components/UpdatesList";
import { isShopifyConnected } from "@/lib/shopify/client";
import { apiVersionStatus, platformUpdates } from "@/lib/updates";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Updates" };

async function ApiVersion() {
  if (!isShopifyConnected()) return null;
  const v = await apiVersionStatus();
  const text =
    v.supported === false
      ? `This dashboard uses Shopify API ${v.ours}, which is no longer supported. Update it now.`
      : v.newest && v.newest > v.ours
        ? `This dashboard uses Shopify API ${v.ours} (supported). Newest: ${v.newest}. Plan the move within the year.`
        : `This dashboard uses Shopify API ${v.ours}, the newest supported version.`;
  return <p className={v.supported === false ? styles.alert : styles.note}>{text}</p>;
}

async function Feeds() {
  await connection();
  const { items, failed } = await platformUpdates();
  const important = items.filter((i) => i.relevant);
  const other = items.filter((i) => !i.relevant);
  return (
    <>
      <ApiVersion />
      {failed.length ? <p className={styles.note}>Could not read right now: {failed.join(", ")}.</p> : null}
      <h2 className={styles.section}>Matters to our stores ({important.length})</h2>
      {important.length ? <UpdatesList items={important} /> : <EmptyState title="Nothing important in the last 30 days" description="Checkout, payments, Merchant Center, search and theme news shows here." />}
      <details className={styles.more}>
        <summary>Everything else ({other.length})</summary>
        <UpdatesList items={other} />
      </details>
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Updates"
        description="Shopify and Google news from their official feeds, last 30 days. Read the source before acting."
      />
      <Suspense fallback={<p>Loading updates…</p>}>
        <Feeds />
      </Suspense>
    </>
  );
}

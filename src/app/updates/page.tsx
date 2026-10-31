import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { UpdatesList } from "@/components/UpdatesList";
import { isShopifyConnected } from "@/lib/shopify/client";
import { apiVersionStatus, platformUpdates, updateKey, updateReviews } from "@/lib/updates";
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
  const [{ items, failed }, reviews] = await Promise.all([platformUpdates(), updateReviews()]);
  const important = items.filter((i) => i.relevant);
  const other = items.filter((i) => !i.relevant);
  const open = important.filter((i) => !reviews.has(updateKey(i))).length;
  return (
    <>
      <ApiVersion />
      {failed.length ? <p className={styles.note}>Could not read right now: {failed.join(", ")}.</p> : null}
      <h2 className={styles.section}>
        Matters to our stores · {open ? `${open} to review` : "all reviewed"}
      </h2>
      {important.length ? (
        <UpdatesList items={important} reviews={reviews} />
      ) : (
        <EmptyState title="Nothing important in the last 30 days" description="Checkout, payments, Merchant Center, search and theme news shows here." />
      )}
      <details className={styles.more}>
        <summary>Everything else ({other.length})</summary>
        <UpdatesList items={other} reviews={reviews} />
      </details>
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Updates"
        description="Shopify and Google news from their official feeds, last 30 days. Tick each one once it is read, and note what we changed."
      />
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Feeds />
      </Suspense>
    </>
  );
}

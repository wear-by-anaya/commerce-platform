import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBox";
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

type Search = Promise<Record<string, string | string[] | undefined>>;
const PER_PAGE = 15;

async function Feeds({ searchParams }: { searchParams: Search }) {
  await connection();
  const params = await searchParams;
  const [{ items, failed }, reviews] = await Promise.all([platformUpdates(), updateReviews()]);
  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const found = q ? items.filter((i) => `${i.title} ${i.source}`.toLowerCase().includes(q)) : items;
  const important = found.filter((i) => i.relevant);
  const other = found.filter((i) => !i.relevant);
  const open = important.filter((i) => !reviews.has(updateKey(i))).length;
  const pages = Math.max(1, Math.ceil(important.length / PER_PAGE));
  const page = Math.min(pageFrom(params.page), pages);
  const shown = important.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <>
      <ApiVersion />
      {failed.length ? <p className={styles.note}>Could not read right now: {failed.join(", ")}.</p> : null}
      <div className={styles.searchRow}>
        <SearchBar placeholder="Search updates" />
      </div>
      <h2 className={styles.section}>
        Matters to our stores · {open ? `${open} to review` : "all reviewed"}
      </h2>
      {important.length ? (
        <>
          <UpdatesList items={shown} reviews={reviews} />
          <Pagination
            prevHref={page > 1 ? withParams("/updates", params, { page: page > 2 ? String(page - 1) : null }) : null}
            nextHref={page < pages ? withParams("/updates", params, { page: String(page + 1) }) : null}
            label={`Page ${page} of ${pages}`}
          />
        </>
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

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader
        title="Updates"
        description="Shopify and Google news from their official feeds, last 30 days. Tick each one once it is read, and note what we changed."
      />
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Feeds searchParams={searchParams} />
      </Suspense>
    </>
  );
}

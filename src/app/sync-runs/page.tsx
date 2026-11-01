import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import { SyncRunForm } from "@/components/SyncRunForm";
import { Badge } from "@/components/ui/Badge";
import form from "@/components/ui/Form.module.css";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBox";
import { SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";
import { isDatabaseConnected } from "@/lib/db";
import { isKind, kindLabel, RUN_KINDS, statusLabel, type RunStatus } from "@/lib/run-kinds";
import { RUNS_PER_PAGE, syncRuns } from "@/lib/sync-runs";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Sync runs" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const TONE: Record<RunStatus, "neutral" | "accent" | "warning"> = { ok: "accent", partial: "warning", failed: "warning" };
const SOURCE: Record<string, string> = { cron: "daily job", script: "script", manual: "by hand" };

async function Runs({ searchParams }: { searchParams: Search }) {
  await connection();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Sync runs are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const params = await searchParams;
  const page = pageFrom(params.page);
  const q = typeof params.q === "string" ? params.q : "";
  const kind = typeof params.kind === "string" && isKind(params.kind) ? params.kind : "";
  const { runs, total, latest } = await syncRuns(page, q, kind);
  const pages = Math.max(1, Math.ceil(total / RUNS_PER_PAGE));
  const last = new Map(latest.map((r) => [r.kind, r]));
  return (
    <div className={form.stack}>
      <section className={styles.latest} aria-label="Last run of each job">
        {RUN_KINDS.filter((k) => k.value !== "other").map((k) => {
          const r = last.get(k.value);
          return (
            <article key={k.value} className={styles.card}>
              <p className={styles.cardLabel}>{k.label}</p>
              {r ? (
                <>
                  <p className={styles.cardValue}>{when(r.finishedAt)}</p>
                  <p className={styles.cardMeta}>
                    <Badge tone={TONE[r.status]}>{statusLabel(r.status)}</Badge>
                    <span>
                      {r.items.toLocaleString("en-GB")} done{r.errors ? ` · ${r.errors.toLocaleString("en-GB")} errors` : ""}
                    </span>
                  </p>
                </>
              ) : (
                <p className={styles.cardMeta}>No run logged yet</p>
              )}
            </article>
          );
        })}
      </section>

      <section>
        <div className={styles.headRow}>
          <nav className={styles.tabs} aria-label="Kind of job">
            {[{ value: "", label: "All" }, ...RUN_KINDS].map((k) => (
              <Link
                key={k.value || "all"}
                href={withParams("/sync-runs", params, { kind: k.value || null, page: null })}
                className={`${styles.tab} ${kind === k.value ? styles.tabOn : ""}`}
                aria-current={kind === k.value ? "page" : undefined}
              >
                {k.label}
              </Link>
            ))}
          </nav>
          <SearchBar placeholder="Search runs" />
        </div>
        {runs.length ? (
          <>
            <div className={table.wrap}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th>Finished</th>
                    <th>Job</th>
                    <th>Kind</th>
                    <th>Result</th>
                    <th>Done</th>
                    <th>Errors</th>
                    <th>Logged by</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Finished">{when(r.finishedAt)}</td>
                      <td data-label="Job">
                        {r.name}
                        {r.detail ? <span className={`${table.sub} ${styles.detail}`}>{r.detail}</span> : null}
                      </td>
                      <td data-label="Kind">{kindLabel(r.kind)}</td>
                      <td data-label="Result">
                        <Badge tone={TONE[r.status]}>{statusLabel(r.status)}</Badge>
                      </td>
                      <td data-label="Done">{r.items.toLocaleString("en-GB")}</td>
                      <td data-label="Errors">{r.errors ? r.errors.toLocaleString("en-GB") : "-"}</td>
                      <td data-label="Logged by">
                        {SOURCE[r.source] ?? r.source}
                        {r.source === "manual" && r.loggedBy ? <span className={table.sub}>{r.loggedBy}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              prevHref={page > 1 ? withParams("/sync-runs", params, { page: page > 2 ? String(page - 1) : null }) : null}
              nextHref={page < pages ? withParams("/sync-runs", params, { page: String(page + 1) }) : null}
              label={`Page ${Math.min(page, pages)} of ${pages}`}
            />
          </>
        ) : (
          <EmptyState
            title={q || kind ? "Nothing matches" : "No runs yet"}
            description={q ? `Nothing found for "${q}".` : "The daily brand check logs itself each night; imports and batches show here once logged."}
          />
        )}
      </section>

      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Log a run</h2>
          <p className={form.help}>For a job done by hand. The daily brand check and our job scripts log their own runs.</p>
        </div>
        <SyncRunForm today={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })} />
      </section>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader
        title="Sync runs"
        description="Daily store jobs: imports, Unstitched batches, brand checks and New Arrivals rebuilds, with counts and errors. Pakistan time."
      />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards count={4} />
            <SkeletonTable rows={6} cols={7} />
          </div>
        }
      >
        <Runs searchParams={searchParams} />
      </Suspense>
    </>
  );
}

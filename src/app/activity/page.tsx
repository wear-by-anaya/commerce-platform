import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import table from "@/components/OrdersTable.module.css";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import form from "@/components/ui/Form.module.css";
import { pageFrom, Pagination, withParams } from "@/components/ui/Pagination";
import { SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";
import { activity, EVENTS_PER_PAGE } from "@/lib/audit";
import { isDatabaseConnected } from "@/lib/db";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Activity" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function Activity({ searchParams }: { searchParams: Search }) {
  await connection();
  const me = await requireUser();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Activity is saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { devices, events, total } = await activity(page);
  const pages = Math.max(1, Math.ceil(total / EVENTS_PER_PAGE));
  const active = devices.filter((d) => d.active);
  return (
    <div className={form.stack}>
      <section className={form.panel}>
        <div className={form.panelHead}>
          <h2 className={form.title}>Active now · {active.length}</h2>
          <p className={form.help}>Seen in the last 5 minutes. Pakistan time. Places come from the internet address and are approximate.</p>
        </div>
        {active.length ? (
          <ul className={styles.people}>
            {active.map((d) => (
              <li key={d.email + d.device} className={styles.person}>
                <span className={styles.dot} aria-hidden="true" />
                <span>
                  <strong>{d.email}</strong>
                  {d.email === me.email ? <span className={styles.you}> (you)</span> : null}
                  <span className={styles.meta}>
                    {d.device}
                    {d.place ? ` · ${d.place}` : ""}
                    {d.lastPath ? ` · on ${d.lastPath}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={form.help}>Nobody else right now.</p>
        )}
      </section>

      <section>
        <h2 className={styles.section}>Devices used</h2>
        {devices.length ? (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Device</th>
                  <th>Place</th>
                  <th>Internet address</th>
                  <th>First seen</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.email + d.device + d.firstSeen}>
                    <td data-label="Person">{d.email}</td>
                    <td data-label="Device">{d.device}</td>
                    <td data-label="Place">{d.place || "-"}</td>
                    <td data-label="Internet address">{d.ip || "-"}</td>
                    <td data-label="First seen">{when(d.firstSeen)}</td>
                    <td data-label="Last seen">
                      {d.active ? <Badge tone="accent">now</Badge> : when(d.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No devices yet" description="Devices show here after the next page view." />
        )}
      </section>

      <section>
        <h2 className={styles.section}>History</h2>
        {events.length ? (
          <>
            <div className={table.wrap}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Person</th>
                    <th>What</th>
                    <th>Device</th>
                    <th>Place</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.at + i}>
                      <td data-label="When">{when(e.at)}</td>
                      <td data-label="Person">{e.email}</td>
                      <td data-label="What">
                        {e.event === "sign-in refused" ? <Badge tone="warning">sign-in refused</Badge> : e.event}
                        {e.detail ? <span className={table.sub}>{e.detail}</span> : null}
                      </td>
                      <td data-label="Device">{e.device || "-"}</td>
                      <td data-label="Place">
                        {e.place || "-"}
                        {e.ip ? <span className={table.sub}>{e.ip}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              prevHref={page > 1 ? withParams("/activity", params, { page: page > 2 ? String(page - 1) : null }) : null}
              nextHref={page < pages ? withParams("/activity", params, { page: String(page + 1) }) : null}
              label={`Page ${Math.min(page, pages)} of ${pages}`}
            />
          </>
        ) : (
          <EmptyState title="No history yet" description="Sign-ins and saved changes show here." />
        )}
      </section>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader title="Activity" description="Who uses this dashboard, from where and on which device. Kept for 180 days." />
      <Suspense
        fallback={
          <div className={form.stack}>
            <SkeletonCards count={1} />
            <SkeletonTable rows={3} cols={6} />
          </div>
        }
      >
        <Activity searchParams={searchParams} />
      </Suspense>
    </>
  );
}

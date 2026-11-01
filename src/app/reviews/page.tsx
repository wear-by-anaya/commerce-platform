import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertDone } from "@/components/AlertDone";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import form from "@/components/ui/Form.module.css";
import { SkeletonList } from "@/components/ui/Skeleton";
import { reviewAlerts, type Alert, type AlertGroup } from "@/lib/alerts";
import { isDatabaseConnected } from "@/lib/db";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Reviews" };

const GROUPS: { id: AlertGroup; title: string; empty: string }[] = [
  { id: "stock", title: "Brand stock", empty: "No new pieces on brand sites in the last 14 days, and every site was read." },
  { id: "jobs", title: "Jobs", empty: "No failed jobs in the last 30 days, and the daily brand check ran." },
  { id: "updates", title: "Updates", empty: "Every Shopify and Google update that matters is reviewed." },
];

const TONE_LABEL = { accent: "New", warning: "Problem", neutral: "To do" } as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <li className={styles.item}>
      <div className={styles.body}>
        <p className={styles.titleRow}>
          <Badge tone={alert.tone}>{TONE_LABEL[alert.tone]}</Badge>
          <span className={styles.title}>{alert.title}</span>
        </p>
        {alert.detail ? <p className={styles.detail}>{alert.detail}</p> : null}
        <p className={styles.meta}>
          {alert.external ? (
            <a href={alert.href} target="_blank" rel="noopener noreferrer">
              {alert.hrefLabel}
            </a>
          ) : (
            <Link href={alert.href}>{alert.hrefLabel}</Link>
          )}
          {alert.at ? <span>{when(alert.at)}</span> : null}
          {alert.done ? <span>Done by {alert.done.by}, {when(alert.done.at)}</span> : null}
          {!alert.dismissable ? <span>Clears itself when fixed</span> : null}
        </p>
      </div>
      {alert.dismissable ? <AlertDone alertKey={alert.key} title={alert.title} done={Boolean(alert.done)} /> : null}
    </li>
  );
}

async function Alerts() {
  await connection();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Brand checks and sync runs are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const { open, done } = await reviewAlerts();
  return (
    <div className={form.stack}>
      <section className={styles.counts} aria-label="Open alerts">
        {GROUPS.map((g) => {
          const n = open.filter((a) => a.group === g.id).length;
          return (
            <a key={g.id} href={`#${g.id}`} className={styles.count}>
              <span className={styles.countLabel}>{g.title}</span>
              <span className={styles.countValue}>{n ? `${n} open` : "All clear"}</span>
            </a>
          );
        })}
      </section>

      {GROUPS.map((g) => {
        const items = open.filter((a) => a.group === g.id);
        return (
          <section key={g.id} id={g.id} className={styles.group}>
            <h2 className={styles.section}>
              {g.title} · {items.length}
            </h2>
            {items.length ? (
              <ul className={styles.list}>
                {items.map((a) => (
                  <AlertItem key={a.key} alert={a} />
                ))}
              </ul>
            ) : (
              <p className={styles.clear}>{g.empty}</p>
            )}
          </section>
        );
      })}

      {done.length ? (
        <details className={styles.more}>
          <summary>Done recently ({done.length})</summary>
          <ul className={styles.list}>
            {done.map((a) => (
              <AlertItem key={a.key} alert={a} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Reviews"
        description="What needs a person: new pieces on brand sites, failed jobs and Shopify or Google updates waiting for review."
      />
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Alerts />
      </Suspense>
    </>
  );
}

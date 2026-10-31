import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SELLER } from "@/lib/invoice";
import { requireUser } from "@/lib/session";
import { connectionStatus } from "@/lib/status";
import styles from "./page.module.css";

async function Connections() {
  await connection();
  const user = await requireUser();
  const status = connectionStatus();
  const rows: [string, boolean, string][] = [
    ["Shopify (read-only app)", status.shopify, "Orders, products and stock"],
    ["Database (Neon)", status.database, "Saved invoices and costs"],
    ["Google sign-in", status.login, "Only listed team emails can sign in"],
  ];
  return (
    <>
      <section className={styles.panel}>
        <h2 className={styles.title}>Connections</h2>
        <ul className={styles.list}>
          {rows.map(([name, ok, what]) => (
            <li key={name} className={styles.row}>
              <span>
                <strong>{name}</strong>
                <span className={styles.sub}>{what}</span>
              </span>
              <Badge tone={ok ? "accent" : "warning"}>{ok ? "connected" : "not set"}</Badge>
            </li>
          ))}
        </ul>
        <p className={styles.note}>Keys and passwords live only in Vercel. This page never shows them.</p>
      </section>
      <section className={styles.panel}>
        <h2 className={styles.title}>Business details on invoices</h2>
        <p className={styles.line}>{SELLER.name} · {SELLER.legal}</p>
        <p className={styles.line}>{SELLER.line1}, {SELLER.line2}</p>
        <p className={styles.line}>{SELLER.phone} · {SELLER.email}</p>
        <p className={styles.note}>Signed in as {user.email}.</p>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="What this dashboard is connected to." />
      <Suspense fallback={<p>Loading…</p>}>
        <Connections />
      </Suspense>
    </>
  );
}

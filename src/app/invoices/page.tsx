import Link from "next/link";
import { Suspense } from "react";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import { SavedInvoices } from "@/components/SavedInvoices";
import buttons from "@/components/ui/Button.module.css";
import { SkeletonTable } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

type Search = Promise<Record<string, string | string[] | undefined>>;

// Two lists, two page controls: saved invoices use ?ipage=, store orders ?o_after= / ?o_before= / ?o_p=.
async function Saved({ searchParams }: { searchParams: Search }) {
  return <SavedInvoices params={await searchParams} />;
}

async function FromOrders({ searchParams }: { searchParams: Search }) {
  return <RecentOrders first={25} path="/invoices" prefix="o_" params={await searchParams} />;
}

export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Store orders get their invoice automatically. Use New invoice for anything else."
        actions={
          <>
            <Link href="/invoices/sample" className={buttons.secondary}>
              Sample
            </Link>
            <Link href="/invoices/new" className={buttons.button}>
              New invoice
            </Link>
          </>
        }
      />
      <h2 className={styles.section}>Saved invoices</h2>
      <Suspense fallback={<SkeletonTable rows={3} cols={5} />}>
        <Saved searchParams={searchParams} />
      </Suspense>
      <h2 className={styles.section}>From store orders</h2>
      <Suspense fallback={<SkeletonTable rows={4} cols={7} />}>
        <FromOrders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

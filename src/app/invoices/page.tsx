import Link from "next/link";
import { Suspense } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { RecentOrders } from "@/components/OrdersTable";
import { PageHeader } from "@/components/PageHeader";
import { SavedInvoices } from "@/components/SavedInvoices";
import buttons from "@/components/ui/Button.module.css";
import styles from "./page.module.css";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Store orders get their invoice automatically. Use New invoice for anything else."
        actions={
          <>
            <Link href="/invoices/sample" className={buttons.secondary}>Sample</Link>
            <Link href="/invoices/new" className={buttons.button}>New invoice</Link>
          </>
        }
      />
      <h2 className={styles.section}>Saved invoices</h2>
      <Suspense fallback={<SkeletonTable rows={3} cols={5} />}>
        <SavedInvoices />
      </Suspense>
      <h2 className={styles.section}>From store orders</h2>
      <Suspense fallback={<SkeletonTable rows={4} cols={7} />}>
        <RecentOrders />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SkeletonPanels } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { InvoiceForm } from "@/components/InvoiceForm";
import { PageHeader } from "@/components/PageHeader";
import { isDatabaseConnected } from "@/lib/db";
import { CURRENCIES } from "@/lib/manual-invoices";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "New invoice" };

async function Form() {
  await connection();
  await requireUser();
  if (!isDatabaseConnected()) {
    return <EmptyState title="Database is not connected" description="Invoices are saved in Neon. Connect it in Vercel (Storage), then redeploy." />;
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  return <InvoiceForm currencies={CURRENCIES} today={today} />;
}

export default function Page() {
  return (
    <>
      <PageHeader title="New invoice" description="For sales and work outside the online store. Numbers are given automatically." />
      <Suspense fallback={<SkeletonPanels count={3} />}>
        <Form />
      </Suspense>
    </>
  );
}

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Invoices" description="Printable invoices, made from orders once Shopify is connected." />
      <EmptyState title="No orders connected yet" description="The template is ready to check." />
      <p>
        <Link href="/invoices/sample">See the sample invoice</Link>
      </p>
    </>
  );
}

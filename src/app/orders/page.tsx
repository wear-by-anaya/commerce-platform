import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Orders" description="Review and manage storefront orders when Shopify is connected." />
      <EmptyState title="Orders will appear here" description="No order feed is connected in this boilerplate." />
    </>
  );
}

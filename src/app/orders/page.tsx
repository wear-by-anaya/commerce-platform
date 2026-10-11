import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Monitor and triage storefront orders once Shopify is connected."
      />
      <PlaceholderPanel
        title="Orders workspace"
        body="No order feed, customer data, or revenue totals are loaded in this boilerplate."
      />
    </>
  );
}

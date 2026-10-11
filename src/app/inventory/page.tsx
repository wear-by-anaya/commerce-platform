import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Track inventory observations and quantity changes after sync integration."
      />
      <PlaceholderPanel
        title="Inventory workspace"
        body="Inventory observations and Shopify-safe mutations are not connected here yet."
      />
    </>
  );
}

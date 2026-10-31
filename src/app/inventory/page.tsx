import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Inventory" description="Track stock levels and changes after sync integration." />
      <EmptyState title="Not built yet" description="Planned: stock per brand, pieces sold out at the brand, and the last brand scan." />
    </>
  );
}

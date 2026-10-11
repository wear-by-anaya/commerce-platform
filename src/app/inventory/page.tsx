import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Inventory" description="Track stock levels and changes after sync integration." />
      <EmptyState title="Inventory is empty" description="Inventory observations are not connected yet." />
    </>
  );
}

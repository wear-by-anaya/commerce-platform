import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Sync runs" description="History and outcomes for stock synchronization." />
      <EmptyState title="Not built yet" description="Planned: daily jobs (Unstitched batches, imports, brand scans) with counts and errors." />
    </>
  );
}

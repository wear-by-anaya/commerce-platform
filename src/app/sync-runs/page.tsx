import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Sync runs" description="History and outcomes for stock synchronization." />
      <EmptyState title="No sync runs" description="Workers are not started from this operations app." />
    </>
  );
}

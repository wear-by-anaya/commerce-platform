import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Reviews" description="Operational exceptions and review queues." />
      <EmptyState title="Not built yet" description="Planned: alerts for season changes, new brand stock and failed jobs." />
    </>
  );
}

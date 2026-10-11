import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Reviews" description="Operational exceptions and review queues." />
      <EmptyState title="Review queue empty" description="Alerts and reviews will show here after backend services exist." />
    </>
  );
}

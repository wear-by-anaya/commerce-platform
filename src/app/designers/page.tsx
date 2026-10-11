import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Designers" description="Designer sources and mapping health for this store." />
      <EmptyState title="No designers loaded" description="Designer directories will arrive with source adapters." />
    </>
  );
}

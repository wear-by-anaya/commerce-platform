import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Workspace identity and connection configuration." />
      <EmptyState title="Settings limited" description="Only non-sensitive store identity is configured. Secrets stay in environment variables." />
    </>
  );
}

import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Store identity, connection status, and environment configuration."
      />
      <PlaceholderPanel
        title="Settings workspace"
        body="Only non-sensitive STORE_SLUG identity is configured. Secrets stay in environment variables."
      />
    </>
  );
}

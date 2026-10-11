import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Sync Runs"
        description="Inspect stock sync history, checkpoints, and run outcomes."
      />
      <PlaceholderPanel
        title="Sync runs workspace"
        body="No sync worker, cron, or run history is started from this repository."
      />
    </>
  );
}

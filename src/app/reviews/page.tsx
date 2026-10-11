import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Queue operational reviews and exception handling."
      />
      <PlaceholderPanel
        title="Reviews workspace"
        body="Review queues and alerts are placeholder-only until backend services exist."
      />
    </>
  );
}

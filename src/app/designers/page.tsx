import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Designers"
        description="Browse designer sources and mapping health for this store."
      />
      <PlaceholderPanel
        title="Designers workspace"
        body="Designer directories and source adapters will arrive with the shared engine integration."
      />
    </>
  );
}

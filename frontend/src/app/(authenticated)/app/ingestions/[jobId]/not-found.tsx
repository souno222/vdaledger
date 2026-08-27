import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { buttonClassName } from "@/components/ui/primitives";

export default function IngestionNotFound() {
  return (
    <EmptyState
      title="Ingestion job not found"
      description="This record is unavailable. Return to your ingestion history."
      action={<Link href="/app/ingestions" className={buttonClassName({ size: "sm" })}>Back to history</Link>}
    />
  );
}


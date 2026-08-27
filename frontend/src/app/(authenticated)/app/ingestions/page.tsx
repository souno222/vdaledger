import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { HistoryView } from "@/features/ingestion/history-view";

export const metadata: Metadata = { title: "Ingestion history" };

export default async function IngestionsPage() {
  await auth.protect();
  return <HistoryView />;
}


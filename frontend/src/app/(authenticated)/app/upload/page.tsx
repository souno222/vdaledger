import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { UploadView } from "@/features/ingestion/upload-view";

export const metadata: Metadata = { title: "Upload CSV" };

export default async function UploadPage() {
  await auth.protect();
  return <UploadView />;
}


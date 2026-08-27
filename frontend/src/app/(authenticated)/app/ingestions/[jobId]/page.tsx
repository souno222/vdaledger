import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { DetailView } from "@/features/ingestion/detail-view";

export const metadata: Metadata = { title: "Ingestion details" };

export default async function IngestionDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await auth.protect();
  const { jobId } = await params;
  if (!z.string().uuid().safeParse(jobId).success) notFound();
  return <DetailView jobId={jobId} />;
}


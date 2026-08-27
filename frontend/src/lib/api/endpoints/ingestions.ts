import { z } from "zod";

import { ApiClientError } from "@/lib/api/api-error";
import type { ApiClient } from "@/lib/api/api-client";
import type { ExchangeType } from "@/lib/api/types";
import {
  ingestionErrorsSchema,
  ingestionHistorySchema,
  ingestionJobSchema,
  ingestionResponseSchema,
} from "@/lib/api/schemas";

const jobIdSchema = z.string().uuid();

function jobPath(jobId: string) {
  if (!jobIdSchema.safeParse(jobId).success) {
    throw new ApiClientError({
      status: 400,
      code: "INVALID_INGESTION_JOB_ID",
      message: "The ingestion job identifier is invalid.",
    });
  }
  return `/api/ingestions/${encodeURIComponent(jobId)}`;
}

export function listIngestions(api: ApiClient, signal?: AbortSignal) {
  return api.get("/api/ingestions", ingestionHistorySchema, {
    ...(signal ? { signal } : {}),
  });
}

export async function getIngestion(
  api: ApiClient,
  jobId: string,
  signal?: AbortSignal,
) {
  return await api.get(jobPath(jobId), ingestionJobSchema, {
    ...(signal ? { signal } : {}),
  });
}

export async function getIngestionErrors(
  api: ApiClient,
  jobId: string,
  signal?: AbortSignal,
) {
  return await api.get(`${jobPath(jobId)}/errors`, ingestionErrorsSchema, {
    ...(signal ? { signal } : {}),
  });
}

export function uploadIngestion(
  api: ApiClient,
  input: { exchange: ExchangeType; file: File },
) {
  const body = new FormData();
  body.set("exchange", input.exchange);
  body.set("file", input.file, input.file.name);
  return api.postForm("/api/ingestions", body, ingestionResponseSchema);
}

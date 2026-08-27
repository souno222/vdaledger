import type { ApiClient } from "@/lib/api/api-client";
import { portfolioSummarySchema } from "@/lib/api/schemas";

export function getPortfolioSummary(api: ApiClient, signal?: AbortSignal) {
  return api.get("/api/portfolio/summary", portfolioSummarySchema, {
    ...(signal ? { signal } : {}),
  });
}

import type { ApiClient } from "@/lib/api/api-client";
import { taxReportSchema } from "@/lib/api/schemas";

export const supportedFinancialYears = ["2025-2026", "2026-2027"] as const;
export type SupportedFinancialYear = (typeof supportedFinancialYears)[number];
export const defaultFinancialYear: SupportedFinancialYear =
  supportedFinancialYears.at(-1)!;

export function getTaxReport(
  api: ApiClient,
  financialYear: SupportedFinancialYear,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ financialYear });
  return api.get(`/api/taxes/liability?${query.toString()}`, taxReportSchema, {
    ...(signal ? { signal } : {}),
  });
}

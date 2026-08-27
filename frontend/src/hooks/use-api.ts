"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { createApiClient } from "@/lib/api/api-client";
import {
  getIngestion,
  getIngestionErrors,
  listIngestions,
  uploadIngestion,
} from "@/lib/api/endpoints/ingestions";
import { listLedgerEvents } from "@/lib/api/endpoints/ledger";
import { getPortfolioSummary } from "@/lib/api/endpoints/portfolio";
import {
  getTaxReport,
  type SupportedFinancialYear,
} from "@/lib/api/endpoints/tax";
import { queryKeys } from "@/lib/api/query-keys";
import type { ExchangeType } from "@/lib/api/types";

function useAuthenticatedApi() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  return {
    api,
    enabled: Boolean(isLoaded && isSignedIn && userId),
    userScope: userId ?? "signed-out",
  };
}

export function useIngestionHistory() {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.ingestions.all(userScope),
    queryFn: ({ signal }) => listIngestions(api, signal),
    enabled,
  });
}

export function useIngestionDetail(jobId: string) {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.ingestions.detail(userScope, jobId),
    queryFn: ({ signal }) => getIngestion(api, jobId, signal),
    enabled,
  });
}

export function useIngestionErrors(jobId: string, requestEnabled = true) {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.ingestions.errors(userScope, jobId),
    queryFn: ({ signal }) => getIngestionErrors(api, jobId, signal),
    enabled: enabled && requestEnabled,
  });
}

export function useUploadIngestion() {
  const { api } = useAuthenticatedApi();
  return useMutation({
    mutationFn: (input: { exchange: ExchangeType; file: File }) =>
      uploadIngestion(api, input),
  });
}

export function useLedgerEvents() {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.ledger.all(userScope),
    queryFn: ({ signal }) => listLedgerEvents(api, signal),
    enabled,
  });
}

export function usePortfolioSummary() {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.portfolio.summary(userScope),
    queryFn: ({ signal }) => getPortfolioSummary(api, signal),
    enabled,
  });
}

export function useTaxReport(financialYear: SupportedFinancialYear) {
  const { api, enabled, userScope } = useAuthenticatedApi();
  return useQuery({
    queryKey: queryKeys.tax.report(userScope, financialYear),
    queryFn: ({ signal }) => getTaxReport(api, financialYear, signal),
    enabled,
  });
}

import type { ApiClient } from "@/lib/api/api-client";
import { ledgerEventsSchema } from "@/lib/api/schemas";

export function listLedgerEvents(api: ApiClient, signal?: AbortSignal) {
  return api.get("/api/ledger-events", ledgerEventsSchema, {
    ...(signal ? { signal } : {}),
  });
}

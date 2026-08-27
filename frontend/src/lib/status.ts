import type { IngestionStatus, LedgerEventType } from "@/lib/api/types";

export const ingestionStatusLabels: Record<IngestionStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  COMPLETED_WITH_ERRORS: "Completed with errors",
  FAILED: "Failed",
};

export const ledgerEventLabels: Record<LedgerEventType, string> = {
  BUY: "Buy",
  SELL: "Sell",
};

const humanizedLabels: Record<string, string> = {
  DUPLICATE_TRANSACTION: "Duplicate transaction",
  INVALID_TRANSACTION_TIMESTAMP: "Invalid transaction timestamp",
  INVALID_NUMERIC_VALUE: "Invalid numeric value",
  MISSING_COLUMN_VALUE: "Missing column value",
  UNSUPPORTED_TRADE_SIDE: "Unsupported trade side",
  UNSUPPORTED_QUOTE_ASSET: "Unsupported quote asset",
  INVALID_CSV_ROW: "Invalid CSV row",
  NO_SET_OFF_OR_CARRY_FORWARD: "No set-off or carry-forward",
  COST_OF_ACQUISITION_ONLY: "Cost of acquisition only",
};

export function humanizeCode(value: string) {
  return (
    humanizedLabels[value] ??
    value
      .toLowerCase()
      .split("_")
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
      )
      .join(" ")
  );
}


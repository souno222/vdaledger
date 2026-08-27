export type Decimal = string;
export type ExchangeType = "BINANCE" | "COINDCX";
export type IngestionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";
export type LedgerEventType = "BUY" | "SELL";

export interface IngestionResponse {
  jobId: string;
  exchange: ExchangeType;
  status: IngestionStatus;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  duplicateRows: number;
  message: string;
}

export interface IngestionJobDetails {
  jobId: string;
  exchange: ExchangeType;
  originalFileName: string;
  status: IngestionStatus;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  duplicateRows: number;
  createdAt: string;
  completedAt: string | null;
}

export interface IngestionErrorRecord {
  id: string;
  rowNumber: number;
  errorCode: string;
  errorMessage: string;
  rawRow: Record<string, string>;
  createdAt: string;
}

export interface LedgerEvent {
  id: string;
  ingestionJobId: string;
  exchange: ExchangeType;
  sourceRowNumber: number | null;
  eventType: LedgerEventType;
  assetSymbol: string;
  quantity: Decimal;
  grossValueInr: Decimal;
  occurredAt: string;
  metadata: Record<string, string>;
}

export interface AssetHolding {
  assetSymbol: string;
  quantity: Decimal;
}

export interface PortfolioSummary {
  assets: AssetHolding[];
}

export interface TaxRules {
  taxRate: Decimal;
  tdsRate: Decimal;
  specifiedPersonTdsThreshold: Decimal;
  otherPersonTdsThreshold: Decimal;
  lossOffsetPolicy: "NO_SET_OFF_OR_CARRY_FORWARD";
  allowedDeductionPolicy: "COST_OF_ACQUISITION_ONLY";
  cessRate: Decimal;
  statutoryReference: string;
}

export interface TaxReport {
  financialYear: string;
  periodStart: string;
  periodEndExclusive: string;
  grossPositiveIncome: Decimal;
  excludedLosses: Decimal;
  baseVdaTax: Decimal;
  applicableSurcharge: Decimal | null;
  healthAndEducationCess: Decimal;
  estimatedTotalTax: Decimal;
  processedSellEvents: number;
  rules: TaxRules;
  warnings: string[];
}

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  path?: string;
  timestamp?: string;
  retryAfter?: string;
}

import { z } from "zod";

const decimalPattern =
  /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u;
const decimalSchema = z.string().regex(decimalPattern);
const nonNegativeIntegerSchema = z
  .union([z.string().regex(/^\d+$/u), z.number().int().nonnegative()])
  .transform((value, context) => {
    const numberValue = Number(value);
    if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
      context.addIssue({
        code: "custom",
        message: "Expected a non-negative safe integer.",
      });
      return z.NEVER;
    }
    return numberValue;
  });
const instantSchema = z.string().datetime({ offset: true });
const exchangeSchema = z.enum(["BINANCE", "COINDCX"]);
const ingestionStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
]);

export const ingestionResponseSchema = z.object({
  jobId: z.string().uuid(),
  exchange: exchangeSchema,
  status: ingestionStatusSchema,
  totalRows: nonNegativeIntegerSchema,
  importedRows: nonNegativeIntegerSchema,
  failedRows: nonNegativeIntegerSchema,
  duplicateRows: nonNegativeIntegerSchema,
  message: z.string(),
});

export const ingestionJobSchema = z.object({
  jobId: z.string().uuid(),
  exchange: exchangeSchema,
  originalFileName: z.string(),
  status: ingestionStatusSchema,
  totalRows: nonNegativeIntegerSchema,
  importedRows: nonNegativeIntegerSchema,
  failedRows: nonNegativeIntegerSchema,
  duplicateRows: nonNegativeIntegerSchema,
  createdAt: instantSchema,
  completedAt: instantSchema.nullable(),
});

export const ingestionHistorySchema = z.array(ingestionJobSchema);

export const ingestionErrorsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    rowNumber: nonNegativeIntegerSchema,
    errorCode: z.string(),
    errorMessage: z.string(),
    rawRow: z.record(z.string(), z.string()),
    createdAt: instantSchema,
  }),
);

export const ledgerEventsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    ingestionJobId: z.string().uuid(),
    exchange: exchangeSchema,
    sourceRowNumber: nonNegativeIntegerSchema.nullable(),
    eventType: z.enum(["BUY", "SELL"]),
    assetSymbol: z.string(),
    quantity: decimalSchema,
    grossValueInr: decimalSchema,
    occurredAt: instantSchema,
    metadata: z.record(z.string(), z.string()),
  }),
);

export const portfolioSummarySchema = z.object({
  assets: z.array(
    z.object({
      assetSymbol: z.string(),
      quantity: decimalSchema,
    }),
  ),
});

export const taxReportSchema = z.object({
  financialYear: z.string(),
  periodStart: instantSchema,
  periodEndExclusive: instantSchema,
  grossPositiveIncome: decimalSchema,
  excludedLosses: decimalSchema,
  baseVdaTax: decimalSchema,
  applicableSurcharge: decimalSchema.nullable(),
  healthAndEducationCess: decimalSchema,
  estimatedTotalTax: decimalSchema,
  processedSellEvents: nonNegativeIntegerSchema,
  rules: z.object({
    taxRate: decimalSchema,
    tdsRate: decimalSchema,
    specifiedPersonTdsThreshold: decimalSchema,
    otherPersonTdsThreshold: decimalSchema,
    lossOffsetPolicy: z.literal("NO_SET_OFF_OR_CARRY_FORWARD"),
    allowedDeductionPolicy: z.literal("COST_OF_ACQUISITION_ONLY"),
    cessRate: decimalSchema,
    statutoryReference: z.string(),
  }),
  warnings: z.array(z.string()),
});

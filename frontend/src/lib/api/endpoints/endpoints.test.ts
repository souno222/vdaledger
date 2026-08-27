import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createApiClient } from "@/lib/api/api-client";
import {
  getIngestion,
  getIngestionErrors,
  listIngestions,
  uploadIngestion,
} from "@/lib/api/endpoints/ingestions";
import { listLedgerEvents } from "@/lib/api/endpoints/ledger";
import { getPortfolioSummary } from "@/lib/api/endpoints/portfolio";
import { getTaxReport } from "@/lib/api/endpoints/tax";
import { server } from "@/test/mocks/server";

const apiBaseUrl = "http://localhost:8080";
const jobId = "52d4ab9a-e1f6-4dad-a461-b8238f1294b7";
const eventId = "8d6b36f0-8e77-429c-8597-51ee2f16817d";
const errorId = "16eb9b93-ecea-4a2e-bc37-57a858cb6fc6";

const job = {
  jobId,
  exchange: "BINANCE",
  originalFileName: "trades.csv",
  status: "COMPLETED",
  totalRows: 1,
  importedRows: 1,
  failedRows: 0,
  duplicateRows: 0,
  createdAt: "2026-07-18T08:00:00Z",
  completedAt: "2026-07-18T08:00:01Z",
};

describe("verified endpoint modules", () => {
  it("uses the exact GET paths and tax query parameter", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/ingestions`, () =>
        HttpResponse.json([job]),
      ),
      http.get(`${apiBaseUrl}/api/ingestions/${jobId}`, () =>
        HttpResponse.json(job),
      ),
      http.get(`${apiBaseUrl}/api/ingestions/${jobId}/errors`, () =>
        HttpResponse.json([
          {
            id: errorId,
            rowNumber: 2,
            errorCode: "DUPLICATE_TRANSACTION",
            errorMessage: "Duplicate transaction at CSV row 2.",
            rawRow: { Pair: "BTCINR" },
            createdAt: "2026-07-18T08:00:01Z",
          },
        ]),
      ),
      http.get(`${apiBaseUrl}/api/ledger-events`, () =>
        HttpResponse.json([
          {
            id: eventId,
            ingestionJobId: jobId,
            exchange: "BINANCE",
            sourceRowNumber: 2,
            eventType: "BUY",
            assetSymbol: "BTC",
            quantity: 0.01,
            grossValueInr: 50000.0,
            occurredAt: "2026-07-18T08:00:00Z",
            metadata: { pair: "BTCINR" },
          },
        ]),
      ),
      http.get(`${apiBaseUrl}/api/portfolio/summary`, () =>
        HttpResponse.json({
          assets: [{ assetSymbol: "BTC", quantity: 0.01 }],
        }),
      ),
      http.get(`${apiBaseUrl}/api/taxes/liability`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("financialYear")).toBe(
          "2026-2027",
        );
        return HttpResponse.json({
          financialYear: "2026-2027",
          periodStart: "2026-03-31T18:30:00Z",
          periodEndExclusive: "2027-03-31T18:30:00Z",
          grossPositiveIncome: 10000.0,
          excludedLosses: 0.0,
          baseVdaTax: 3000.0,
          applicableSurcharge: null,
          healthAndEducationCess: 120.0,
          estimatedTotalTax: 3120.0,
          processedSellEvents: 1,
          rules: {
            taxRate: 0.3,
            tdsRate: 0.01,
            specifiedPersonTdsThreshold: 50000.0,
            otherPersonTdsThreshold: 10000.0,
            lossOffsetPolicy: "NO_SET_OFF_OR_CARRY_FORWARD",
            allowedDeductionPolicy: "COST_OF_ACQUISITION_ONLY",
            cessRate: 0.04,
            statutoryReference:
              "Income-tax Act, Section 115BBH; Section 194S",
          },
          warnings: ["Estimate only."],
        });
      }),
    );
    const api = createApiClient(async () => "test-session-token");

    await expect(listIngestions(api)).resolves.toHaveLength(1);
    await expect(getIngestion(api, jobId)).resolves.toMatchObject({ jobId });
    await expect(getIngestionErrors(api, jobId)).resolves.toHaveLength(1);
    await expect(listLedgerEvents(api)).resolves.toMatchObject([
      { quantity: "0.01", grossValueInr: "50000" },
    ]);
    await expect(getPortfolioSummary(api)).resolves.toEqual({
      assets: [{ assetSymbol: "BTC", quantity: "0.01" }],
    });
    await expect(getTaxReport(api, "2026-2027")).resolves.toMatchObject({
      financialYear: "2026-2027",
      estimatedTotalTax: "3120",
    });
  });

  it("uses POST multipart fields exactly and leaves the boundary to fetch", async () => {
    server.use(
      http.post(`${apiBaseUrl}/api/ingestions`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe(
          "Bearer test-session-token",
        );
        expect(request.headers.get("content-type")).toMatch(
          /^multipart\/form-data; boundary=/u,
        );
        const form = await request.formData();
        expect(form.get("exchange")).toBe("COINDCX");
        const file = form.get("file");
        expect(file).toBeTruthy();
        expect((file as File).type).toBe("text/csv");
        expect((file as File).size).toBeGreaterThan(0);

        return HttpResponse.json(
          {
            jobId,
            exchange: "COINDCX",
            status: "COMPLETED",
            totalRows: 1,
            importedRows: 1,
            failedRows: 0,
            duplicateRows: 0,
            message: "CSV ingestion completed successfully.",
          },
          { status: 201 },
        );
      }),
    );
    const api = createApiClient(async () => "test-session-token");
    const file = new File(["Trade ID,Crypto Pair\n"], "trades.csv", {
      type: "text/csv",
    });

    await expect(
      uploadIngestion(api, { exchange: "COINDCX", file }),
    ).resolves.toMatchObject({
      jobId,
      status: "COMPLETED",
      importedRows: 1,
      exchange: "COINDCX",
    });
  });

  it("rejects malformed job identifiers without a request", async () => {
    const api = createApiClient(async () => "test-session-token");

    await expect(getIngestion(api, "../other-user")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_INGESTION_JOB_ID",
    });
  });
});

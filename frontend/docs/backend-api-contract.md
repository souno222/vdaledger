# Verified Backend API Contract

Sources are under `backend/src/main/java/in/sounodip/vdaledger` and `backend/src/test/java/in/sounodip/vdaledger`.

## Shared security and identity

- `SecurityConfig.java` permits `/api/health`, actuator health, Swagger/OpenAPI, and Clerk webhook routes. All users, ingestions, ledger, portfolio, and tax routes require a bearer JWT.
- The JWT decoder validates issuer, timestamps, and a non-blank subject.
- `CurrentUserService.java` derives the Clerk user ID exclusively from the verified JWT `sub`, then resolves/provisions the internal user.
- The frontend must never send a `userId` to select an identity.
- The product UI intentionally does not consume `GET /api/users/me` because its backend DTO includes Clerk and internal identifiers that the browser does not need.
- Ownership of ingestion jobs is enforced by repository lookup using both internal user ID and job ID. A missing or foreign job returns the same 404.
- CORS allows exactly `${FRONTEND_ORIGIN}`, credentials, `Authorization` and `Content-Type`, and GET/POST/PATCH/DELETE/OPTIONS.
- No Clerk token template or audience is configured. The backend expects a normal Clerk session JWT whose issuer matches `app.security.clerk-issuer`.

## Shared error shape

`ApiErrorResponse.java`:

```ts
{
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
}
```

Common statuses:

- `400`: bad request, missing/malformed input, unsupported financial year, CSV errors.
- `401`: absent, invalid, or expired bearer token.
- `403`: authenticated but denied.
- `404`: missing/foreign ingestion job.
- `409`: persistence conflict.
- `422`: a ledger state would produce insufficient asset inventory.
- `429`: ingestion POST rate limit; `Retry-After` contains seconds.
- `500`: generic unexpected server failure.

## Endpoint matrix

| Feature | Method and full path | Auth and authorization | Request | Success | Feature errors | Backend verification source | Frontend consumer |
|---|---|---|---|---|---|---|---|
| Health | `GET /api/health` | Public | None | `200`; `{ status: "UP", service: "vda-ledger" }` | Generic 500 | `common/HealthController.java`, `config/SecurityConfigTest.java` | Not currently consumed |
| Current user | `GET /api/users/me` | Bearer required; identity from JWT subject | None | `200`; `{ id: UUID, clerkUserId: string, email: string|null, createdAt: Instant }` | 400 authenticated user unavailable; 401/403/409/500 | `user/UserController.java`, `user/CurrentUserResponse.java`, `security/CurrentUserService.java`, `config/SecurityConfigTest.java` | Not consumed by the product UI |
| Upload ingestion | `POST /api/ingestions` | Bearer required; job owner from JWT-derived user | `multipart/form-data`; exact fields `exchange` (`BINANCE` or `COINDCX`) and `file`; max request/file 20MB | `201`; `{ jobId, exchange, status, totalRows, importedRows, failedRows, duplicateRows, message }` | 400 empty/read/header/request/file errors; 409 conflict; 429 with `Retry-After`; 500 | `ingestion/IngestionController.java`, `ExchangeType.java`, `IngestionService.java`, response/enum classes, `application.properties`, `IngestionServiceTest.java`, `CoinDcxCsvStrategyTest.java`, `ratelimit/*` | upload |
| Ingestion history | `GET /api/ingestions` | Bearer required; only current user's jobs | None; no pagination/filter query support | `200`; array of job details, newest first | 401/403/500 | `ingestion/IngestionController.java`, `IngestionService.java`, `IngestionJobDetailsResponse.java` | dashboard, ingestions |
| Ingestion detail | `GET /api/ingestions/{jobId}` | Bearer required; owned UUID only | Path `jobId: UUID` | `200`; one job detail | 400 malformed UUID; 404 missing or foreign job; 401/403/500 | controller/service/DTO above; `SecurityConfigTest.java` | ingestion detail |
| Ingestion errors | `GET /api/ingestions/{jobId}/errors` | Bearer required; ownership checked before rows are returned | Path `jobId: UUID` | `200`; array `{ id, rowNumber, errorCode, errorMessage, rawRow, createdAt }`, row-number ascending | 400 malformed UUID; 404 missing or foreign job; 401/403/500 | `IngestionController.java`, `IngestionService.java`, `IngestionErrorResponse.java`, `SecurityConfigTest.java` | ingestion detail |
| Ledger | `GET /api/ledger-events` | Bearer required; current user's events only | None; no pagination/filter/sort query support | `200`; array ordered occurredAt then ID ascending | 401/403/500 | `ledger/LedgerController.java`, `LedgerService.java`, `LedgerEventResponse.java` | dashboard, ledger |
| Portfolio | `GET /api/portfolio/summary` | Bearer required; current user's ledger only | None | `200`; `{ assets: [{ assetSymbol, quantity: BigDecimal }] }`; sorted by symbol, zero positions omitted | 401/403; 422 negative balance; 500 | `portfolio/PortfolioController.java`, response/service classes, `PortfolioServiceTest.java`, `SecurityConfigTest.java` | dashboard, portfolio |
| Tax | `GET /api/taxes/liability?financialYear={value}` | Bearer required; current user's ledger only | Required query `financialYear`; exact supported values `2025-2026`, `2026-2027` | `200`; `TaxReportResponse` including exclusive end timestamp, BigDecimal totals/rules, nullable surcharge, warnings | 400 missing/unsupported year; 401/403; 422 insufficient FIFO inventory; 500 | `tax/TaxController.java`, `TaxReportResponse.java`, calculation/rule classes, `TaxCalculationServiceTest.java`, `SecurityConfigTest.java` | dashboard, tax |

## Exact response notes

### Ingestion job detail

```ts
{
  jobId: string;
  exchange: "BINANCE" | "COINDCX";
  originalFileName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" |
          "COMPLETED_WITH_ERRORS" | "FAILED";
  totalRows: number;
  importedRows: number;
  failedRows: number;
  duplicateRows: number;
  createdAt: string;
  completedAt: string | null;
}
```

Ingestion is synchronous in the current backend. The frontend must not poll.

### Ledger event

```ts
{
  id: string;
  ingestionJobId: string;
  exchange: "BINANCE" | "COINDCX";
  sourceRowNumber: number | null;
  eventType: "BUY" | "SELL";
  assetSymbol: string;
  quantity: decimal;
  grossValueInr: decimal;
  occurredAt: string;
  metadata: Record<string, string>;
}
```

The backend serializes Java `BigDecimal` as JSON numbers. The frontend transport must preserve the original numeric token before display formatting.

### Tax report

```ts
{
  financialYear: string;
  periodStart: string;
  periodEndExclusive: string;
  grossPositiveIncome: decimal;
  excludedLosses: decimal;
  baseVdaTax: decimal;
  applicableSurcharge: decimal | null;
  healthAndEducationCess: decimal;
  estimatedTotalTax: decimal;
  processedSellEvents: number;
  rules: {
    taxRate: decimal;
    tdsRate: decimal;
    specifiedPersonTdsThreshold: decimal;
    otherPersonTdsThreshold: decimal;
    lossOffsetPolicy: "NO_SET_OFF_OR_CARRY_FORWARD";
    allowedDeductionPolicy: "COST_OF_ACQUISITION_ONLY";
    cessRate: decimal;
    statutoryReference: string;
  };
  warnings: string[];
}
```

The browser displays these values only. FIFO, gains, excluded losses, tax, cess, and totals remain backend-owned.

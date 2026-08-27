import type { ApiError } from "@/lib/api/types";

export class ApiClientError extends Error implements ApiError {
  readonly status: number;
  readonly code?: string;
  readonly path?: string;
  readonly timestamp?: string;
  readonly retryAfter?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = error.status;
    if (error.code) this.code = error.code;
    if (error.path) this.path = error.path;
    if (error.timestamp) this.timestamp = error.timestamp;
    if (error.retryAfter) this.retryAfter = error.retryAfter;
  }
}

const fallbackMessages: Record<number, string> = {
  0: "The API could not be reached. Check your connection and backend configuration.",
  400: "The request could not be processed. Check the submitted values.",
  401: "Your session has expired. Sign in again to continue.",
  403: "You do not have permission to access this resource.",
  404: "The requested record could not be found.",
  409: "The request conflicts with an existing record.",
  422: "The backend rejected this request because the ledger state is invalid.",
  429: "Too many requests. Wait a moment and try again.",
  500: "The backend encountered an unexpected error. Try again.",
};

const authenticationMessages: Record<string, string> = {
  AUTHENTICATION_REQUIRED:
    "The backend received no usable Clerk bearer token. Refresh once; if this continues, verify the authentication configuration.",
  INVALID_BEARER_TOKEN:
    "The backend rejected the current Clerk token. Refresh once; if this continues, verify that the frontend and backend use the same Clerk instance.",
};

function readString(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
}

function canShowBackendMessage(status: number, code?: string) {
  if (status >= 500 || status === 401 || status === 403) return false;
  if (code === "INVALID_REQUEST") return false;
  return [400, 404, 409, 422, 429].includes(status);
}

export function normalizeApiError(
  status: number,
  payload: unknown,
  retryAfter?: string,
) {
  const body =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const code = readString(body, "code");
  const path = readString(body, "path");
  const timestamp = readString(body, "timestamp");
  const backendMessage = readString(body, "message");
  const fallback =
    status === 401 && code && authenticationMessages[code]
      ? authenticationMessages[code]
      : status === 429 && retryAfter
      ? `Too many requests. Try again after ${retryAfter} seconds.`
      : fallbackMessages[status] ?? "The request failed unexpectedly.";

  return new ApiClientError({
    status,
    message:
      backendMessage && canShowBackendMessage(status, code)
        ? backendMessage
        : fallback,
    ...(code ? { code } : {}),
    ...(path ? { path } : {}),
    ...(timestamp ? { timestamp } : {}),
    ...(retryAfter ? { retryAfter } : {}),
  });
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function createNetworkError() {
  return new ApiClientError({
    status: 0,
    code: "NETWORK_ERROR",
    message: fallbackMessages[0]!,
  });
}

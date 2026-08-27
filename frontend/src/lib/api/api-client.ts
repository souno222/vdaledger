import type { z } from "zod";

import { clientEnvironment } from "@/config/env.client";
import {
  ApiClientError,
  createNetworkError,
  normalizeApiError,
} from "@/lib/api/api-error";
import { parseJsonPreservingNumbers } from "@/lib/api/json";

export type TokenProvider = () => Promise<string | null>;
export type AuthenticationMode = "required" | "optional" | "none";

export interface ApiRequestOptions extends RequestInit {
  auth?: AuthenticationMode;
}

export interface ApiClient {
  request<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: ApiRequestOptions,
  ): Promise<T>;
  get<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ): Promise<T>;
  postForm<T>(
    path: string,
    body: FormData,
    schema: z.ZodType<T>,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ): Promise<T>;
  postJson<T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ): Promise<T>;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return text;

  try {
    return parseJsonPreservingNumbers(text);
  } catch {
    return undefined;
  }
}

function resolveApiUrl(path: string) {
  if (!path.startsWith("/api/") || path.startsWith("//")) {
    throw new ApiClientError({
      status: 0,
      code: "INVALID_API_PATH",
      message: "The application attempted to use an invalid API path.",
    });
  }

  const baseUrl = new URL(clientEnvironment.NEXT_PUBLIC_API_BASE_URL);
  const requestUrl = new URL(path, baseUrl);
  if (requestUrl.origin !== baseUrl.origin) {
    throw new ApiClientError({
      status: 0,
      code: "CROSS_ORIGIN_API_PATH",
      message: "The application blocked an unsafe cross-origin API request.",
    });
  }
  return requestUrl;
}

function isAbortError(error: unknown, signal?: AbortSignal | null) {
  return (
    signal?.aborted === true ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function createApiClient(tokenProvider?: TokenProvider): ApiClient {
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const { auth = "required", ...init } = options;
    const token =
      auth === "none" || !tokenProvider ? null : await tokenProvider();

    if (auth === "required" && !token) {
      throw new ApiClientError({
        status: 401,
        code: "SESSION_TOKEN_UNAVAILABLE",
        message: "Your session could not be verified. Sign in again to continue.",
      });
    }

    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.delete("Authorization");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body instanceof FormData) headers.delete("Content-Type");

    const requestUrl = resolveApiUrl(path);
    let response: Response;
    try {
      response = await fetch(requestUrl, {
        ...init,
        cache: init.cache ?? (auth === "none" ? "default" : "no-store"),
        headers,
      });
    } catch (error) {
      if (isAbortError(error, init.signal)) {
        throw new DOMException("The request was aborted.", "AbortError");
      }
      throw createNetworkError();
    }

    const payload = await readPayload(response);
    if (!response.ok) {
      throw normalizeApiError(
        response.status,
        payload,
        response.headers.get("retry-after") ?? undefined,
      );
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiClientError({
        status: 500,
        code: "INVALID_BACKEND_RESPONSE",
        message: "The backend returned data in an unexpected format.",
      });
    }

    return parsed.data;
  }

  return {
    request,
    get<T>(
      path: string,
      schema: z.ZodType<T>,
      options?: Omit<ApiRequestOptions, "body" | "method">,
    ) {
      return request(path, schema, { ...options, method: "GET" });
    },
    postForm<T>(
      path: string,
      body: FormData,
      schema: z.ZodType<T>,
      options?: Omit<ApiRequestOptions, "body" | "method">,
    ) {
      return request(path, schema, { ...options, method: "POST", body });
    },
    postJson<T>(
      path: string,
      body: unknown,
      schema: z.ZodType<T>,
      options?: Omit<ApiRequestOptions, "body" | "method">,
    ) {
      const headers = new Headers(options?.headers);
      headers.set("Content-Type", "application/json");
      return request(path, schema, {
        ...options,
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    },
  };
}

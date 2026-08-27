import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createApiClient } from "@/lib/api/api-client";
import { portfolioSummarySchema } from "@/lib/api/schemas";
import { server } from "@/test/mocks/server";

const apiBaseUrl = "http://localhost:8080";
const safeAccountSchema = z.object({
  email: z.string().email().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

describe("API client", () => {
  it("gets a fresh Clerk token and sends it as a Bearer credential", async () => {
    const getToken = vi.fn(async () => "test-session-token");
    const client = createApiClient(getToken);

    const account = await client.get("/api/users/me", safeAccountSchema);

    expect(account).toEqual({
      email: "investor@example.com",
      createdAt: "2026-07-16T10:00:00Z",
    });
    expect(account).not.toHaveProperty("id");
    expect(account).not.toHaveProperty("clerkUserId");
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it("stops before fetch when a required session token is unavailable", async () => {
    const client = createApiClient(async () => null);

    await expect(
      client.get("/api/users/me", safeAccountSchema),
    ).rejects.toMatchObject({
      status: 401,
      code: "SESSION_TOKEN_UNAVAILABLE",
    });
  });

  it("allows an explicitly public request to omit authorization", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/health`, ({ request }) => {
        expect(request.headers.get("Authorization")).toBeNull();
        return HttpResponse.json({ status: "UP", service: "vda-ledger" });
      }),
    );
    const client = createApiClient();

    await expect(
      client.get(
        "/api/health",
        z.object({ status: z.literal("UP"), service: z.literal("vda-ledger") }),
        {
          auth: "none",
          headers: { Authorization: "Bearer caller-controlled-token" },
        },
      ),
    ).resolves.toEqual({ status: "UP", service: "vda-ledger" });
  });

  it("overwrites caller-supplied authorization with a fresh Clerk token", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/users/me`, ({ request }) => {
        expect(request.headers.get("Authorization")).toBe(
          "Bearer fresh-session-token",
        );
        return HttpResponse.json({
          id: "6c73c08a-c60e-49d1-95d2-791f7af62d97",
          clerkUserId: "user_vda_ledger_test",
          email: "investor@example.com",
          createdAt: "2026-07-18T09:00:00Z",
          updatedAt: "2026-07-18T09:00:00Z",
        });
      }),
    );
    const client = createApiClient(async () => "fresh-session-token");

    await expect(
      client.get("/api/users/me", safeAccountSchema, {
        headers: { Authorization: "Bearer stale-or-attacker-token" },
      }),
    ).resolves.toMatchObject({ email: "investor@example.com" });
  });

  it("sets JSON content type and does not set a manual FormData boundary", async () => {
    server.use(
      http.post(`${apiBaseUrl}/api/json`, ({ request }) => {
        expect(request.headers.get("content-type")).toBe("application/json");
        return HttpResponse.json({ accepted: true });
      }),
      http.post(`${apiBaseUrl}/api/form`, async ({ request }) => {
        expect(request.headers.get("content-type")).toMatch(
          /^multipart\/form-data; boundary=/u,
        );
        const body = await request.formData();
        expect(body.get("exchange")).toBe("BINANCE");
        return HttpResponse.json({ accepted: true });
      }),
    );
    const client = createApiClient(async () => "test-session-token");
    const resultSchema = z.object({ accepted: z.boolean() });

    await expect(
      client.postJson("/api/json", { value: "safe" }, resultSchema),
    ).resolves.toEqual({ accepted: true });

    const form = new FormData();
    form.set("exchange", "BINANCE");
    await expect(
      client.postForm("/api/form", form, resultSchema, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ).resolves.toEqual({ accepted: true });
  });

  it("handles an empty successful response", async () => {
    server.use(
      http.delete(
        `${apiBaseUrl}/api/empty`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const client = createApiClient(async () => "test-session-token");

    await expect(
      client.request("/api/empty", z.undefined(), { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it.each([401, 403, 404, 409, 422, 429, 500])(
    "maps HTTP %s to a typed application error",
    async (status) => {
      server.use(
        http.get(`${apiBaseUrl}/api/failure`, () =>
          HttpResponse.json(
            { code: `STATUS_${status}`, message: "Safe backend detail" },
            {
              status,
              ...(status === 429
                ? { headers: { "Retry-After": "7" } }
                : {}),
            },
          ),
        ),
      );
      const client = createApiClient(async () => "test-session-token");

      await expect(
        client.get("/api/failure", z.unknown()),
      ).rejects.toMatchObject({
        status,
        code: `STATUS_${status}`,
        ...(status === 429 ? { retryAfter: "7" } : {}),
      });
    },
  );

  it("distinguishes a backend-rejected Clerk token from a missing frontend session", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/users/me`, () =>
        HttpResponse.json(
          {
            code: "INVALID_BEARER_TOKEN",
            message: "The bearer token is missing, invalid, or expired.",
          },
          { status: 401 },
        ),
      ),
    );
    const client = createApiClient(async () => "test-session-token");

    await expect(
      client.get("/api/users/me", safeAccountSchema),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_BEARER_TOKEN",
      message:
        "The backend rejected the current Clerk token. Refresh once; if this continues, verify that the frontend and backend use the same Clerk instance.",
    });
  });

  it("does not include bearer tokens or unsafe server detail in errors", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/failure`, () =>
        HttpResponse.json(
          {
            code: "INTERNAL_SERVER_ERROR",
            message: "test-session-token database stack detail",
          },
          { status: 500 },
        ),
      ),
    );
    const client = createApiClient(async () => "test-session-token");

    const error = await client
      .get("/api/failure", z.unknown())
      .catch((caught: unknown) => caught);
    expect(String(error)).not.toContain("test-session-token");
    expect(String(error)).not.toContain("database stack detail");
  });

  it("preserves backend decimal tokens before response validation", async () => {
    server.use(
      http.get(
        `${apiBaseUrl}/api/portfolio/summary`,
        () =>
          new HttpResponse(
            '{"assets":[{"assetSymbol":"BTC","quantity":12345678901234567890.123456789}]}',
            { headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    const client = createApiClient(async () => "test-session-token");

    await expect(
      client.get("/api/portfolio/summary", portfolioSummarySchema),
    ).resolves.toEqual({
      assets: [
        {
          assetSymbol: "BTC",
          quantity: "12345678901234567890.123456789",
        },
      ],
    });
  });

  it("normalizes network failures and preserves request cancellation", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/network`, () => HttpResponse.error()),
      http.get(`${apiBaseUrl}/api/slow`, async () => {
        await delay(200);
        return HttpResponse.json({ ok: true });
      }),
    );
    const client = createApiClient(async () => "test-session-token");

    await expect(
      client.get("/api/network", z.unknown()),
    ).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });

    const controller = new AbortController();
    const pending = client.get("/api/slow", z.object({ ok: z.boolean() }), {
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects non-API, absolute, and protocol-relative paths before transport", async () => {
    const client = createApiClient(async () => "test-session-token");

    await expect(client.get("/collect", z.unknown())).rejects.toMatchObject({
      code: "INVALID_API_PATH",
    });
    await expect(
      client.get("https://example.com/collect", z.unknown()),
    ).rejects.toMatchObject({ code: "INVALID_API_PATH" });
    await expect(
      client.get("//example.com/collect", z.unknown()),
    ).rejects.toMatchObject({ code: "INVALID_API_PATH" });
  });

  it("rejects a successful response that violates the backend contract", async () => {
    server.use(
      http.get(`${apiBaseUrl}/api/users/me`, () =>
        HttpResponse.json({ id: 7 }),
      ),
    );
    const client = createApiClient(async () => "test-session-token");

    await expect(
      client.get("/api/users/me", safeAccountSchema),
    ).rejects.toMatchObject({
      status: 500,
      code: "INVALID_BACKEND_RESPONSE",
    });
  });
});

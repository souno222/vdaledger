import { http, HttpResponse } from "msw";

export const currentUserFixture = {
  id: "30a9ae11-8b54-4e61-9ba2-28579293c749",
  clerkUserId: "user_vda_ledger_test",
  email: "investor@example.com",
  createdAt: "2026-07-16T10:00:00Z",
};

export const handlers = [
  http.get("http://localhost:8080/api/users/me", ({ request }) => {
    if (request.headers.get("Authorization") !== "Bearer test-session-token") {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Missing session token" },
        { status: 401 },
      );
    }

    return HttpResponse.json(currentUserFixture);
  }),
];

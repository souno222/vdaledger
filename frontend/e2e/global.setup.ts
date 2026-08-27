import { createClerkClient } from "@clerk/backend";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";
import { randomUUID } from "node:crypto";

const testEmail = "vda-ledger+clerk_test_e2e@example.com";
const protectedDashboardPaths = [
  "/api/ingestions",
  "/api/ledger-events",
  "/api/portfolio/summary",
  "/api/taxes/liability",
] as const;

async function ensureTestUser() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required for authenticated E2E tests.");
  }

  const client = createClerkClient({ secretKey });
  const existing = await client.users.getUserList({
    emailAddress: [testEmail],
    limit: 1,
  });
  const exactUser = existing.data.find((user) =>
    user.emailAddresses.some(
      (emailAddress) => emailAddress.emailAddress === testEmail,
    ),
  );
  if (exactUser) return exactUser;

  return client.users.createUser({
    firstName: "VDA",
    lastName: "E2E",
    emailAddress: [testEmail],
    password: `Vda!${randomUUID()}Aa9`,
  });
}

setup.describe.configure({ mode: "serial" });

setup("create a real Clerk session accepted by Spring", async ({ page }) => {
  await clerkSetup();
  await ensureTestUser();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: testEmail });

  const protectedResponses = protectedDashboardPaths.map((apiPath) =>
    page.waitForResponse(
      (response) => new URL(response.url()).pathname === apiPath,
      { timeout: 60_000 },
    ),
  );
  await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" });

  const responses = await Promise.all(protectedResponses);
  for (const response of responses) {
    expect(response.status(), `${new URL(response.url()).pathname} status`).toBe(
      200,
    );
    const authorization = response.request().headers()["authorization"];
    expect(
      Boolean(
        authorization?.startsWith("Bearer ") && authorization.length > 20,
      ),
      `${new URL(response.url()).pathname} has a bearer token`,
    ).toBe(true);
  }

  await expect(
    page.getByRole("heading", { level: 1, name: /Welcome back, vda-ledger/i }),
  ).toBeVisible({ timeout: 30_000 });
});

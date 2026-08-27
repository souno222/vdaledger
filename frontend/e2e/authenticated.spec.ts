import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const testEmail = "vda-ledger+clerk_test_e2e@example.com";

test("signed-in sign-in redirects once, data loads, and sign-out removes access", async ({
  page,
}) => {
  let backendIdentityRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/users/me") {
      backendIdentityRequests += 1;
    }
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: testEmail });

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/app\/dashboard(?:\?.*)?$/u, {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: /Welcome back, vda-ledger/i }),
  ).toBeVisible();
  await expect(page.getByText("The backend rejected this session")).toHaveCount(
    0,
  );
  await expect(page.getByText("Sign in is required")).toHaveCount(0);

  await page.goto("/app/profile", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: "Profile" }),
  ).toBeVisible();
  await expect(page.getByText("Internal user ID")).toHaveCount(0);
  await expect(page.getByText("Clerk identifier")).toHaveCount(0);
  await expect(
    page
      .getByRole("main")
      .getByText(testEmail, { exact: true }),
  ).toBeVisible();
  expect(backendIdentityRequests).toBe(0);

  await clerk.signOut({ page });
  await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/sign-in/u);
});

import { expect, test } from "@playwright/test";

test("landing page exposes the complete product story", async ({ page }, testInfo) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response).not.toBeNull();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(response?.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Every tax number should leave a trail/i,
    }),
  ).toBeVisible();
  const primaryCallToAction = page
    .getByRole("link", { name: "Start your ledger" })
    .first();
  await expect(primaryCallToAction).toHaveAttribute("href", "/sign-up");
  await expect(primaryCallToAction).toHaveCSS("color", "rgb(13, 54, 23)");
  await expect(
    page.getByRole("heading", {
      name: "A straight path from source to report.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Illustrative structure · no account data/i),
  ).toBeVisible();
  await expect(page.getByText(/VDA Ledger provides an educational estimate/i)).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("layout does not overflow at the prescribed viewport", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
});

test("mobile navigation is keyboard-operable", async ({ page }, testInfo) => {
  test.skip(
    !["mobile-390", "tablet-768"].includes(testInfo.project.name),
    "The full navigation appears at 1024px.",
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const menu = page.getByRole("button", { name: "Open site navigation" });
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(async () => {
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(dialog.getByRole("link", { name: "Capabilities" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
});





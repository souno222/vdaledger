import { defineConfig } from "@playwright/test";

const publicEnvironment = {
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "/app/dashboard",
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: "/app/dashboard",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: publicEnvironment,
  },
  projects: [
    {
      name: "mobile-390",
      testMatch: /landing\.spec\.ts/u,
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet-768",
      testMatch: /landing\.spec\.ts/u,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "laptop-1024",
      testMatch: /landing\.spec\.ts/u,
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: "desktop-1440",
      testMatch: /landing\.spec\.ts/u,
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});

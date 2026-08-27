import { defineConfig } from "@playwright/test";
import { config as loadEnvironment } from "dotenv";

import publicConfig from "./playwright.config";

loadEnvironment({ path: ".env", quiet: true });

if (
  !process.env.CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
) {
  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export default defineConfig({
  ...publicConfig,
  projects: [
    {
      name: "clerk-setup",
      testMatch: /global\.setup\.ts/u,
    },
    {
      name: "authenticated-desktop",
      testMatch: /authenticated\.spec\.ts/u,
      dependencies: ["clerk-setup"],
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

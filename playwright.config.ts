import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/e2e-global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: process.env.CI !== "true",
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "E2E_DEV_ROUTES=1 node api/index.js",
      url: "http://localhost:8080/api/health",
      reuseExistingServer: process.env.CI !== "true",
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});

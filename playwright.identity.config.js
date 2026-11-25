import { defineConfig, devices } from "@playwright/test";

// Real-stack identity tests: a running dev server (port 5173, proxies /bff and /api to the local API),
// the local Keycloak (8081), PostgreSQL (55432) and Mailpit (8025). They are serial because they share
// accounts and mailboxes. Run with: npx playwright test -c playwright.identity.config.js
export default defineConfig({
  testDir: "./e2e-identity",
  // Authenticator (OTP) specs are deferred: MFA is optional in this release and OTP verification is an open limitation.
  testIgnore: ["**/mfa.spec.js", "**/rbac-flow.spec.js"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "test-results/identity",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "identity-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

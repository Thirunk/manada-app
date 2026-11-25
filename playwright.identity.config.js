import { defineConfig, devices } from "@playwright/test";

// Identity flows run against the locally running stack (Vite :5173 -> API :5080 -> Keycloak :8081,
// Mailpit :8025). They do not start servers; start the stack first (see backend/README in docs).
export default defineConfig({
  testDir: "./e2e-identity",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "identity-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});

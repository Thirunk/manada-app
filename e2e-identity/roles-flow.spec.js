import { expect, test } from "@playwright/test";
import {
  APP,
  TEST_PASSWORD,
  completeRequiredActions,
  latestActionLink,
  reissueInvitation,
} from "./helpers.js";

/*
 * Real-stack role verification: real Keycloak password sign-in (MFA optional in this release), the real
 * invitation email in Mailpit, the real API and PostgreSQL. Serial, because accounts are created in sequence:
 * SuperAdmin creates an Administrator, the Administrator creates Staff, and a Customer is tested last.
 */

const SUPERADMIN_EMAIL = process.env.E2E_SUPERADMIN_EMAIL ?? "";
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? "";
const stamp = Date.now();
const ADMIN_EMAIL = `e2e.admin.${stamp}@manada.local`;
const STAFF_EMAIL = `e2e.staff.${stamp}@manada.local`;

test.describe.configure({ mode: "serial" });

async function passwordSignIn(page, email) {
  await page.goto("/bff/login?returnUrl=/");
  if (await page.locator("#username").isVisible().catch(() => false)) {
    await page.locator("#username").fill(email);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#kc-login").click();
  }
  await page.waitForURL((url) => url.origin === APP && !url.pathname.startsWith("/realms"), {
    timeout: 60_000,
  });
}

/** Sends a fresh invitation and completes it with the real set-password page. Returns when the password is set. */
async function setPasswordFromInvitation(page, email) {
  const sentAfter = Date.now();
  await reissueInvitation(email, { requireTotp: false });
  const link = await latestActionLink(email, { notBefore: sentAfter - 5_000 });
  await page.goto(link);
  await completeRequiredActions(page, { password: TEST_PASSWORD });
}

async function signOutViaPortal(page) {
  // Sign-out lives in the portal frame, so return to the caller's own portal first (access-denied pages have no frame).
  const current = await (await page.request.get(`${APP}/bff/session`)).json();
  const home = { SuperAdmin: "/portal/superadmin", Admin: "/portal/admin", Staff: "/portal/staff", Customer: "/portal/customer" }[current.user.role];
  await page.goto(home);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/portal"), { timeout: 30_000 });
  const session = await (await page.request.get(`${APP}/bff/session`)).json();
  expect(session.authenticated).toBe(false);
}

test("SuperAdmin signs in with a password and creates an administrator @identity", async ({ page }) => {
  test.skip(!SUPERADMIN_EMAIL, "Set E2E_SUPERADMIN_EMAIL to the bootstrapped SuperAdmin address.");

  await setPasswordFromInvitation(page, SUPERADMIN_EMAIL);
  await passwordSignIn(page, SUPERADMIN_EMAIL);

  const session = await (await page.request.get(`${APP}/bff/session`)).json();
  expect(session.user.role).toBe("SuperAdmin");

  await page.goto("/portal/superadmin");
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

  await page.goto("/portal/superadmin/administrators");
  await expect(page.getByRole("heading", { name: "Administrators", exact: true })).toBeVisible();
  await page.getByLabel(/Email address/).fill(ADMIN_EMAIL);
  await page.getByLabel(/Full name/).fill("E2E Administrator");
  await page.getByRole("button", { name: "Create administrator" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Administrator created" })).toBeVisible({ timeout: 30_000 });

  await page.getByRole("searchbox").fill(ADMIN_EMAIL.split("@")[0]);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("cell", { name: ADMIN_EMAIL, exact: true })).toBeVisible({ timeout: 30_000 });

  await page.goto("/portal/superadmin/audit");
  await expect(page.getByRole("heading", { name: "Security audit log" })).toBeVisible();

  await signOutViaPortal(page);
});

test("Administrator sets a password, signs in, creates staff and is refused SuperAdmin pages @identity", async ({ page }) => {
  test.skip(!SUPERADMIN_EMAIL, "Requires the SuperAdmin test to run first.");

  await setPasswordFromInvitation(page, ADMIN_EMAIL);
  await passwordSignIn(page, ADMIN_EMAIL);

  const session = await (await page.request.get(`${APP}/bff/session`)).json();
  expect(session.user.role).toBe("Admin");

  await page.goto("/portal/admin/staff");
  await expect(page.getByRole("heading", { name: "Staff", exact: true })).toBeVisible();
  await page.getByLabel(/Email address/).fill(STAFF_EMAIL);
  await page.getByLabel(/Full name/).fill("E2E Staff");
  await page.getByRole("button", { name: "Create staff member" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Staff member created" })).toBeVisible({ timeout: 30_000 });

  // Out-of-scope: the SuperAdmin portal is refused, and the API refuses administrator listing.
  await page.goto("/portal/superadmin");
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  const adminList = await page.request.get(`${APP}/api/admin/users?role=Admin`);
  expect(adminList.status()).toBe(403);

  await signOutViaPortal(page);
});

test("Staff sets a password, signs in, and cannot reach administration @identity", async ({ page }) => {
  test.skip(!SUPERADMIN_EMAIL, "Requires the Administrator test to run first.");

  await setPasswordFromInvitation(page, STAFF_EMAIL);
  await passwordSignIn(page, STAFF_EMAIL);

  const session = await (await page.request.get(`${APP}/bff/session`)).json();
  expect(session.user.role).toBe("Staff");

  await page.goto("/portal/staff");
  await expect(page.getByRole("heading", { name: "Staff dashboard" })).toBeVisible();
  await page.goto("/portal/admin");
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  expect((await page.request.get(`${APP}/api/admin/users`)).status()).toBe(403);

  await signOutViaPortal(page);
});

test("Customer signs in, updates the profile, and cannot read another account @identity", async ({ page }) => {
  test.skip(!CUSTOMER_EMAIL, "Set E2E_CUSTOMER_EMAIL to an existing customer address.");

  await setPasswordFromInvitation(page, CUSTOMER_EMAIL);
  await passwordSignIn(page, CUSTOMER_EMAIL);

  const session = await (await page.request.get(`${APP}/bff/session`)).json();
  expect(session.user.role).toBe("Customer");

  await page.goto("/portal/customer");
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();

  await page.goto("/portal/customer/profile");
  await page.getByLabel(/Phone number/).fill("+44 20 7946 0000");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toBeVisible({ timeout: 30_000 });

  await expect(page.getByRole("heading", { name: "Your sessions" })).toBeVisible();

  expect((await page.request.get(`${APP}/api/admin/users?role=Customer`)).status()).toBe(403);
  await signOutViaPortal(page);
});

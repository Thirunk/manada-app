import { expect, test } from "@playwright/test";
import {
  APP,
  TEST_PASSWORD,
  completeRequiredActions,
  latestActionLink,
  reissueInvitation,
} from "./helpers.js";

/*
 * Real-stack portal features: administrator role change, organization rename, audit filtering, cross-session
 * revocation, Admin staff status changes, and Staff/Customer session management. Serial and self-contained:
 * the SuperAdmin creates the accounts these tests use, through the real invitation flow.
 */

const SUPERADMIN_EMAIL = process.env.E2E_SUPERADMIN_EMAIL ?? "";
const stamp = Date.now();
const ROLE_ADMIN = `feat.admin.${stamp}@manada.local`;
const ADMIN_EMAIL = `feat.admin2.${stamp}@manada.local`;
const STAFF_EMAIL = `feat.staff.${stamp}@manada.local`;
const ORIGINAL_ORG_NAME = "Manada Embroidery Machine Solution";

test.describe.configure({ mode: "serial" });

async function passwordSignIn(page, email) {
  await page.goto("/bff/login?returnUrl=/");
  if (await page.locator("#username").isVisible().catch(() => false)) {
    await page.locator("#username").fill(email);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#kc-login").click();
  }
  await page.waitForURL((url) => url.origin === APP && !url.pathname.startsWith("/realms"), { timeout: 60_000 });
}

async function setPasswordFromInvitation(page, email) {
  const sentAfter = Date.now();
  await reissueInvitation(email, { requireTotp: false });
  const link = await latestActionLink(email, { notBefore: sentAfter - 5_000 });
  await page.goto(link);
  await completeRequiredActions(page, { password: TEST_PASSWORD });
}

async function createFromPage(page, path, formName, buttonName, email, fullName, expectedText) {
  await page.goto(path);
  await page.getByLabel(/Email address/).fill(email);
  await page.getByLabel(/Full name/).fill(fullName);
  await page.getByRole("button", { name: buttonName }).click();
  await expect(page.getByRole("status").filter({ hasText: expectedText })).toBeVisible({ timeout: 30_000 });
}

test("SuperAdmin changes an administrator's role, renames the organization and filters the audit log @identity", async ({ page }) => {
  test.skip(!SUPERADMIN_EMAIL, "Set E2E_SUPERADMIN_EMAIL to the bootstrapped SuperAdmin address.");

  await setPasswordFromInvitation(page, SUPERADMIN_EMAIL);
  await passwordSignIn(page, SUPERADMIN_EMAIL);

  await createFromPage(page, "/portal/superadmin/administrators", "Create administrator", "Create administrator",
    ROLE_ADMIN, "Role Change Admin", "Administrator created");

  // Role management: the administrator moves to Staff through the real role control.
  await page.goto("/portal/superadmin/administrators");
  await page.getByRole("searchbox").fill(ROLE_ADMIN.split("@")[0]);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("cell", { name: ROLE_ADMIN, exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel(`Role for ${ROLE_ADMIN}`).selectOption("Staff");
  await expect(page.getByRole("status").filter({ hasText: `${ROLE_ADMIN} is now Staff.` })).toBeVisible({ timeout: 30_000 });

  // Organization rename, then restore the original name so the environment is left as found.
  await page.goto("/portal/superadmin/organization");
  await page.getByLabel("Organization name").fill("Manada E2E Renamed");
  await page.getByRole("button", { name: "Save organization" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Organization settings saved." })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Organization name").fill(ORIGINAL_ORG_NAME);
  await page.getByRole("button", { name: "Save organization" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Organization settings saved." })).toBeVisible({ timeout: 30_000 });

  // Audit filtering: the outcome filter reloads the log, and the table or an honest empty state is shown.
  await page.goto("/portal/superadmin/audit");
  await page.getByLabel("Outcome").selectOption("Success");
  await expect(
    page.getByRole("table").or(page.getByText("No audit events match this view")),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/portal"), { timeout: 30_000 });
});

test("SuperAdmin revokes another of the same account's sessions from the profile page @identity", async ({ page, browser }) => {
  test.skip(!SUPERADMIN_EMAIL, "Requires the SuperAdmin test to run first.");

  // A second, independent browser context is a second real session for the same account.
  const second = await browser.newContext();
  const secondPage = await second.newPage();
  try {
    await passwordSignIn(secondPage, SUPERADMIN_EMAIL);
    await passwordSignIn(page, SUPERADMIN_EMAIL);

    await page.goto("/portal/superadmin/profile");
    await expect(page.getByRole("heading", { name: "Your sessions" })).toBeVisible();
    // Sessions are listed newest first. This page signed in last, so the second context's session is at index 1.
    await expect(page.getByRole("button", { name: "Revoke session" }).nth(1)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Revoke session" }).nth(1).click();
    await expect(page.getByRole("status").filter({ hasText: "Session revoked." })).toBeVisible({ timeout: 30_000 });

    const revoked = await (await secondPage.request.get(`${APP}/bff/session`)).json();
    expect(revoked.authenticated).toBe(false);
    const current = await (await page.request.get(`${APP}/bff/session`)).json();
    expect(current.authenticated).toBe(true);
  } finally {
    await second.close();
  }
});

test("Administrator manages staff status, then staff signs in and manages their own session @identity", async ({ page, browser }) => {
  test.skip(!SUPERADMIN_EMAIL, "Requires the SuperAdmin test to run first.");

  // SuperAdmin creates an Administrator and the Administrator creates a staff member.
  await setPasswordFromInvitation(page, SUPERADMIN_EMAIL);
  await passwordSignIn(page, SUPERADMIN_EMAIL);
  await createFromPage(page, "/portal/superadmin/administrators", "Create administrator", "Create administrator",
    ADMIN_EMAIL, "Feature Administrator", "Administrator created");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/portal"), { timeout: 30_000 });

  const adminPage = await (await browser.newContext()).newPage();
  await setPasswordFromInvitation(adminPage, ADMIN_EMAIL);
  await passwordSignIn(adminPage, ADMIN_EMAIL);
  await createFromPage(adminPage, "/portal/admin/staff", "Create staff member", "Create staff member",
    STAFF_EMAIL, "Feature Staff", "Staff member created");

  // Status management: disable the new staff member, then activate again.
  await adminPage.goto("/portal/admin/staff");
  await adminPage.getByRole("searchbox").fill(STAFF_EMAIL.split("@")[0]);
  await adminPage.getByRole("button", { name: "Search" }).click();
  await expect(adminPage.getByRole("cell", { name: STAFF_EMAIL, exact: true })).toBeVisible({ timeout: 30_000 });
  // The new account is pending (no password yet), so its control offers activation first.
  await adminPage.getByRole("button", { name: `Activate ${STAFF_EMAIL}` }).click();
  await expect(adminPage.getByRole("status").filter({ hasText: "was activated." })).toBeVisible({ timeout: 30_000 });
  await adminPage.getByRole("button", { name: `Disable ${STAFF_EMAIL}` }).click();
  await expect(adminPage.getByRole("status").filter({ hasText: "was disabled." })).toBeVisible({ timeout: 30_000 });
  await adminPage.getByRole("button", { name: `Activate ${STAFF_EMAIL}` }).click();
  await expect(adminPage.getByRole("status").filter({ hasText: "was activated." })).toBeVisible({ timeout: 30_000 });

  // The Administrator's own profile shows account information and sessions.
  await adminPage.goto("/portal/admin/profile");
  await expect(adminPage.getByRole("heading", { name: "Your sessions" })).toBeVisible();
  await adminPage.getByRole("button", { name: "Sign out" }).click();
});

test("Staff signs in and manages their own profile and session @identity", async ({ browser }) => {
  test.skip(!SUPERADMIN_EMAIL, "Requires the earlier tests to run first.");

  const staffPage = await (await browser.newContext()).newPage();
  await setPasswordFromInvitation(staffPage, STAFF_EMAIL);
  await passwordSignIn(staffPage, STAFF_EMAIL);

  await staffPage.goto("/portal/staff/profile");
  await staffPage.getByLabel(/Display name/).fill("Feature Staff Updated");
  await staffPage.getByRole("button", { name: "Save profile" }).click();
  await expect(staffPage.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible({ timeout: 30_000 });
  await expect(staffPage.getByRole("heading", { name: "Your sessions" })).toBeVisible();

  await staffPage.getByRole("button", { name: "Sign out" }).click();
  await staffPage.waitForURL((url) => !url.pathname.startsWith("/portal"), { timeout: 30_000 });
  expect((await (await staffPage.request.get(`${APP}/bff/session`)).json()).authenticated).toBe(false);
});

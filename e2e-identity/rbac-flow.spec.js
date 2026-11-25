import { expect, test } from "@playwright/test";
import {
  APP,
  TEST_PASSWORD,
  apiSession,
  reissueInvitation,
  completeRequiredActions,
  latestActionLink,
  signInWithTotp,
} from "./helpers.js";

// Synthetic identities only. The SuperAdmin is created by the one-time bootstrap command.
const SUPERADMIN_EMAIL = "superadmin.test@manada.local";

async function openInvitation(page, email, notBefore) {
  const link = await latestActionLink(email, { notBefore });
  await page.goto(link);
  return completeRequiredActions(page, { password: TEST_PASSWORD });
}

async function createAccount(page, csrfToken, body) {
  return page.request.post(`${APP}/api/admin/users`, {
    data: body,
    headers: { Origin: APP, "X-CSRF-TOKEN": csrfToken },
  });
}

test("SuperAdmin provisions an Admin, Admin provisions Staff, and privilege boundaries hold @identity", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const stamp = Date.now();
  const adminEmail = `admin.${stamp}@manada.local`;
  const staffEmail = `staff.${stamp}@manada.local`;

  // ---- SuperAdmin: complete the bootstrap invitation (password + authenticator), then sign in ----
  await reissueInvitation(SUPERADMIN_EMAIL);
  const superContext = await browser.newContext({ baseURL: APP });
  const superPage = await superContext.newPage();
  const superSecret = await openInvitation(superPage, SUPERADMIN_EMAIL);
  expect(superSecret).toBeTruthy();
  await signInWithTotp(superPage, SUPERADMIN_EMAIL, superSecret);

  const superSession = await apiSession(superPage.request);
  expect(superSession.authenticated).toBe(true);
  expect(superSession.user.role).toBe("SuperAdmin");
  expect(superSession.permissions).toEqual(
    expect.arrayContaining([
      "users.manage.admins",
      "roles.assign",
      "audit.read",
    ]),
  );

  // SuperAdmin creates an Admin. Creation is audited and returns the invitation status.
  const sentAt = Date.now();
  const createAdmin = await createAccount(superPage, superSession.csrfToken, {
    email: adminEmail,
    fullName: "Sample Admin",
    role: "Admin",
    jobTitle: null,
    branchCode: null,
  });
  expect(createAdmin.status()).toBe(201);
  expect((await createAdmin.json()).invitationSent).toBe(true);

  // A SuperAdmin cannot create another SuperAdmin through the API (bootstrap only).
  const createSuper = await createAccount(superPage, superSession.csrfToken, {
    email: `super.${stamp}@manada.local`,
    fullName: "Not Allowed",
    role: "SuperAdmin",
    jobTitle: null,
    branchCode: null,
  });
  expect(createSuper.status()).toBe(400);

  // ---- Admin: complete invitation, sign in, check scope and negative boundaries ----
  const adminContext = await browser.newContext({ baseURL: APP });
  const adminPage = await adminContext.newPage();
  const adminSecret = await openInvitation(adminPage, adminEmail, sentAt);
  await signInWithTotp(adminPage, adminEmail, adminSecret);

  const adminSession = await apiSession(adminPage.request);
  expect(adminSession.user.role).toBe("Admin");
  expect(adminSession.permissions).toEqual(
    expect.arrayContaining(["users.manage.staff", "users.manage.customers"]),
  );
  expect(adminSession.permissions).not.toEqual(
    expect.arrayContaining(["roles.assign", "audit.read", "settings.manage"]),
  );

  // Admin cannot read the audit trail.
  const adminAudit = await adminPage.request.get(`${APP}/api/admin/audit`);
  expect(adminAudit.status()).toBe(403);

  // Admin cannot create another Admin (privilege escalation).
  const adminCreatesAdmin = await createAccount(
    adminPage,
    adminSession.csrfToken,
    {
      email: `escalate.${stamp}@manada.local`,
      fullName: "Escalation Attempt",
      role: "Admin",
      jobTitle: null,
      branchCode: null,
    },
  );
  expect(adminCreatesAdmin.status()).toBe(403);

  // Admin cannot change anyone's role.
  const superRow = await (
    await adminPage.request.get(
      `${APP}/api/admin/users?search=${encodeURIComponent(SUPERADMIN_EMAIL)}`,
    )
  ).json();
  expect(superRow.items).toHaveLength(0);

  // Admin provisions Staff.
  const staffSentAt = Date.now();
  const createStaff = await createAccount(adminPage, adminSession.csrfToken, {
    email: staffEmail,
    fullName: "Sample Staff",
    role: "Staff",
    jobTitle: "Embroidery technician",
    branchCode: null,
  });
  expect(createStaff.status()).toBe(201);

  // ---- Staff: complete invitation, sign in, confirm the minimal scope ----
  const staffContext = await browser.newContext({ baseURL: APP });
  const staffPage = await staffContext.newPage();
  const staffSecret = await openInvitation(staffPage, staffEmail, staffSentAt);
  await signInWithTotp(staffPage, staffEmail, staffSecret);

  const staffSession = await apiSession(staffPage.request);
  expect(staffSession.user.role).toBe("Staff");
  expect(staffSession.permissions).toEqual(["profile.self"]);
  expect((await staffPage.request.get(`${APP}/api/admin/users`)).status()).toBe(
    403,
  );

  // ---- Admin disables the Staff account; the existing Staff session stops working immediately ----
  const list = await (
    await adminPage.request.get(
      `${APP}/api/admin/users?search=${encodeURIComponent(staffEmail)}`,
    )
  ).json();
  const staffRecord = list.items.find((item) => item.email === staffEmail);
  expect(staffRecord).toBeTruthy();

  const disable = await adminPage.request.put(
    `${APP}/api/admin/users/${staffRecord.id}/status`,
    {
      data: { active: false, rowVersion: staffRecord.rowVersion },
      headers: { Origin: APP, "X-CSRF-TOKEN": adminSession.csrfToken },
    },
  );
  expect(disable.status()).toBe(200);

  const afterDisable = await apiSession(staffPage.request);
  expect(afterDisable.authenticated).toBe(false);

  await Promise.all([
    superContext.close(),
    adminContext.close(),
    staffContext.close(),
  ]);
});

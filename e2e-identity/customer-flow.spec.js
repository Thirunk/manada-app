import { expect, test } from "@playwright/test";

const MAILPIT = "http://localhost:8025";
const PASSWORD = "Sample-Pass-2026!";

async function latestMessageLink(to) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages`)).json();
    const match = (list.messages ?? []).find((m) =>
      (m.To ?? []).some((t) => t.Address === to),
    );
    if (match) {
      const full = await (
        await fetch(`${MAILPIT}/api/v1/message/${match.ID}`)
      ).json();
      const body = `${full.Text ?? ""}\n${full.HTML ?? ""}`;
      const link = body.match(/http:\/\/localhost:8081\/[^\s"'<>]+/);
      if (link) return link[0].replace(/&amp;/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Verification email was not received.");
}

test("customer registers, verifies email, signs in, and signs out @identity", async ({
  page,
  baseURL,
}) => {
  const email = `customer.${Date.now()}@manada.local`;

  await page.goto("/bff/login?returnUrl=/");
  await page.getByRole("link", { name: /register/i }).click();
  await page.locator("#firstName").fill("Sample");
  await page.locator("#lastName").fill("Customer");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#password-confirm").fill(PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  // Keycloak sends the verification email to Mailpit; follow the link.
  const verifyLink = await latestMessageLink(email);
  await page.goto(verifyLink);

  // Sign in after verification (the session starts only after a successful sign-in).
  await page.goto("/bff/login?returnUrl=/");
  if (
    await page
      .locator("#username")
      .isVisible()
      .catch(() => false)
  ) {
    await page.locator("#username").fill(email);
    await page.locator("#password").fill(PASSWORD);
    await page.locator("#kc-login").click();
  }
  await page.waitForURL(
    (url) => url.origin === baseURL && !url.pathname.startsWith("/realms"),
    { timeout: 60_000 },
  );

  const session = await (
    await page.request.get(`${baseURL}/bff/session`)
  ).json();
  expect(session.authenticated).toBe(true);
  expect(session.user.email).toBe(email);
  expect(session.user.role).toBe("Customer");
  expect(session.permissions).toEqual(
    expect.arrayContaining(["profile.self", "customer.self"]),
  );
  expect(session.permissions).not.toContain("users.read");
  expect(session.csrfToken).toBeTruthy();

  // Unsafe requests without the CSRF token are rejected.
  const rejected = await page.request.post(`${baseURL}/api/me/profile`, {
    data: { displayName: "Changed", phone: null, companyName: null },
    headers: { Origin: baseURL },
  });
  expect(rejected.status()).toBe(403);

  // With the CSRF token the profile update succeeds.
  const updated = await page.request.put(`${baseURL}/api/me/profile`, {
    data: {
      displayName: "Sample Customer",
      phone: "+91 9608134164",
      companyName: "Sample Co",
    },
    headers: { Origin: baseURL, "X-CSRF-TOKEN": session.csrfToken },
  });
  expect(updated.status()).toBe(200);

  // Logout revokes the server-side session.
  const loggedOut = await page.request.post(`${baseURL}/bff/logout`, {
    headers: { Origin: baseURL, "X-CSRF-TOKEN": session.csrfToken },
  });
  expect(loggedOut.status()).toBe(200);
  const after = await (await page.request.get(`${baseURL}/bff/session`)).json();
  expect(after.authenticated).toBe(false);
});

import { createHmac } from "node:crypto";

export const MAILPIT = "http://localhost:8025";
export const KEYCLOAK = "http://localhost:8081";
export const APP = "http://localhost:5173";

// Test-only password for synthetic identities. Never used outside local development.
export const TEST_PASSWORD = "Sample-Pass-2026!";

let lastTotpSubmittedAt = 0;

const debug = (message) => {
  if (process.env.IDENTITY_DEBUG) console.log(message);
};

/** Polls Mailpit for the newest message to an address and returns the first Keycloak action link. */
export async function latestActionLink(
  to,
  { notBefore = 0, timeoutMs = 60_000 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages`)).json();
    const candidates = (list.messages ?? [])
      .filter((m) => (m.To ?? []).some((t) => t.Address === to))
      .filter((m) => Date.parse(m.Created) >= notBefore)
      .sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created));
    for (const message of candidates) {
      const full = await (
        await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)
      ).json();
      const body = `${full.Text ?? ""}\n${full.HTML ?? ""}`;
      const link = body.match(/http:\/\/localhost:8081\/[^\s"'<>]+/);
      if (link) return link[0].replace(/&amp;/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`No action email arrived for ${to}.`);
}

/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30-second step). Keycloak displays the enrollment key as raw
 * text, and the HMAC key is those bytes. Base32 keys are decoded when the input is valid base32.
 */
export function totp(secret, at = Date.now()) {
  // Keycloak uses the displayed enrollment string as raw bytes for the HMAC key, regardless of its characters.
  const key = Buffer.from(secret.replace(/s+/g, ""), "utf8");

  const counter = Math.floor(at / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

/** Waits for a fresh TOTP window so a code is never reused within one period. */
export async function waitForFreshWindow(secondsNeeded = 5) {
  const remaining = 30 - ((Date.now() / 1000) % 30);
  if (remaining < secondsNeeded) {
    await new Promise((resolve) =>
      setTimeout(resolve, (remaining + 0.5) * 1000),
    );
  }
}

async function describe(page) {
  const heading = await page
    .locator("h1, #kc-page-title")
    .first()
    .innerText({ timeout: 2000 })
    .catch(() => "");
  const error = await page
    .evaluate(() =>
      [
        ...document.querySelectorAll(
          "[id*=error], [class*=alert], [class*=feedback]",
        ),
      ]
        .map((e) => e.textContent.trim())
        .filter(Boolean)
        .join(" | "),
    )
    .catch(() => "");
  return `url=${page.url().slice(0, 90)} heading="${heading.slice(0, 60)}" error="${error.slice(0, 160)}"`;
}

/**
 * Completes Keycloak required actions (email verification, password, authenticator enrollment)
 * reached from an invitation link. Returns the enrolled TOTP secret, or null if none was shown.
 */
export async function completeRequiredActions(
  page,
  { password = TEST_PASSWORD } = {},
) {
  let totpSecret = null;
  lastTotpSubmittedAt = 0;
  for (let step = 0; step < 25; step += 1) {
    debug(`ACTION step=${step} ${await describe(page)}`);
    if (page.url().startsWith(APP)) return totpSecret;
    const finished = await page
      .locator("#kc-page-title")
      .first()
      .innerText({ timeout: 1000 })
      .catch(() => "");
    if (/has been (updated|verified)/i.test(finished)) return totpSecret;

    if (
      await page
        .locator("#password-new")
        .isVisible()
        .catch(() => false)
    ) {
      await page.locator("#password-new").fill(password);
      await page.locator("#password-confirm").fill(password);
      await page
        .locator('input[type="submit"], button[type="submit"]')
        .first()
        .click();
      await page.waitForLoadState("domcontentloaded");
      continue;
    }

    if ((await page.locator("#totpSecret").count()) > 0) {
      totpSecret = (await page.locator("#totpSecret").inputValue()).trim();
      if (lastTotpSubmittedAt) {
        // A code already submitted in this window is rejected by Keycloak; wait for the next window.
        const nextWindow =
          (Math.floor(lastTotpSubmittedAt / 30000) + 1) * 30000 + 1000;
        if (nextWindow > Date.now())
          await new Promise((resolve) =>
            setTimeout(resolve, nextWindow - Date.now()),
          );
      }
      await waitForFreshWindow();
      await page.locator("#totp").fill(totp(totpSecret));
      await page
        .locator("#userLabel")
        .fill("Local test device")
        .catch(() => {});
      await page
        .locator('input[type="submit"], button[type="submit"]')
        .first()
        .click();
      await page.waitForLoadState("domcontentloaded");
      continue;
    }

    // The "Perform the following action(s)" page starts the first pending action with a link.
    const actionLink = page.locator('a[href*="action-token"]').first();
    if (await actionLink.isVisible().catch(() => false)) {
      await page.goto(await actionLink.getAttribute("href"));
      await page.waitForLoadState("domcontentloaded");
      continue;
    }

    const continueButton = page.locator("#kc-continue").first();
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await page.waitForLoadState("domcontentloaded");
      continue;
    }

    await page.waitForTimeout(500);
  }
  return totpSecret;
}

/** Signs in through the BFF with a password and, when prompted, an authenticator code. */
export async function signInWithTotp(
  page,
  email,
  secret,
  { password = TEST_PASSWORD } = {},
) {
  await page.goto("/bff/login?returnUrl=/");
  await page.waitForLoadState("domcontentloaded");

  for (let step = 0; step < 8 && !page.url().startsWith(APP); step += 1) {
    debug(`SIGNIN step=${step} ${await describe(page)}`);
    if (
      await page
        .locator("#username")
        .isVisible()
        .catch(() => false)
    ) {
      await page.locator("#username").fill(email);
      await page.locator("#password").fill(password);
      await page.locator("#kc-login").click();
    } else if (
      await page
        .locator("#otp")
        .isVisible()
        .catch(() => false)
    ) {
      const sinceEnrollment = Date.now() - lastTotpSubmittedAt;
      if (lastTotpSubmittedAt && sinceEnrollment < 31_000) {
        await new Promise((resolve) =>
          setTimeout(resolve, 31_000 - sinceEnrollment),
        );
      }
      await waitForFreshWindow();
      await page.locator("#otp").fill(totp(secret));
      await page.locator("#kc-login").click();
    } else {
      await page.waitForTimeout(500);
    }
    await page.waitForLoadState("domcontentloaded");
  }

  try {
    await page.waitForURL(
      (url) => url.href.startsWith(APP) && !url.pathname.startsWith("/realms"),
      {
        timeout: 30_000,
      },
    );
  } catch (error) {
    throw new Error(
      `Sign-in did not return to the application: ${await describe(page)}`,
      { cause: error },
    );
  }
}

export async function apiSession(request) {
  return (await request.get(`${APP}/bff/session`)).json();
}

// Loads local development secrets for the identity test process (git-ignored file). Values are never logged.
try {
  process.loadEnvFile("infra/local/.env");
} catch {
  // The file is optional when the variables are already set in the environment.
}

async function adminToken() {
  const response = await fetch(
    `${KEYCLOAK}/realms/manada/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: "manada-backend",
        client_secret: process.env.BACKEND_CLIENT_SECRET ?? "",
      }),
    },
  );
  if (!response.ok)
    throw new Error("Backend service sign-in failed for identity reset.");
  return (await response.json()).access_token;
}

/**
 * Re-issues an invitation for a bootstrap identity: removes its authenticator, requires password
 * and authenticator setup again, and sends a new actions email. Test and recovery use only.
 */
export async function reissueInvitation(email) {
  const token = await adminToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const base = `${KEYCLOAK}/admin/realms/manada`;

  const [user] = await (
    await fetch(`${base}/users?email=${encodeURIComponent(email)}&exact=true`, {
      headers,
    })
  ).json();
  if (!user) throw new Error(`No identity exists for ${email}.`);

  const credentials = await (
    await fetch(`${base}/users/${user.id}/credentials`, { headers })
  ).json();
  for (const credential of credentials.filter((c) => c.type === "otp")) {
    await fetch(`${base}/users/${user.id}/credentials/${credential.id}`, {
      method: "DELETE",
      headers,
    });
  }

  const full = await (
    await fetch(`${base}/users/${user.id}`, { headers })
  ).json();
  const required = ["VERIFY_EMAIL", "UPDATE_PASSWORD", "CONFIGURE_TOTP"];
  await fetch(`${base}/users/${user.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...full, requiredActions: required }),
  });

  const sent = await fetch(`${base}/users/${user.id}/execute-actions-email`, {
    method: "PUT",
    headers,
    body: JSON.stringify(required),
  });
  if (!sent.ok)
    throw new Error(`Could not send the invitation (${sent.status}).`);
}

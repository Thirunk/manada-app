import { expect, test } from "@playwright/test";
import {
  APP,
  KEYCLOAK,
  apiSession,
  completeRequiredActions,
  latestActionLink,
  reissueInvitation,
  signInWithTotp,
} from "./helpers.js";

const SUPERADMIN_EMAIL = "superadmin.test@manada.local";

async function keycloakEvents() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "manada-backend",
    client_secret: process.env.BACKEND_CLIENT_SECRET ?? "",
  });
  const token = (
    await (
      await fetch(`${KEYCLOAK}/realms/manada/protocol/openid-connect/token`, {
        method: "POST",
        body,
      })
    ).json()
  ).access_token;
  const events = await (
    await fetch(`${KEYCLOAK}/admin/realms/manada/events?max=40`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json();
  return events.map(
    (e) =>
      `${e.time} ${e.type} ${e.error ?? ""} ${JSON.stringify(e.details ?? {}).slice(0, 120)}`,
  );
}

test("SuperAdmin enrolls an authenticator and signs in with a one-time code @mfa", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  await reissueInvitation(SUPERADMIN_EMAIL);

  const context = await browser.newContext({ baseURL: APP });
  const page = await context.newPage();
  await page.goto(await latestActionLink(SUPERADMIN_EMAIL));
  const secret = await completeRequiredActions(page);
  expect(secret).toBeTruthy();

  await signInWithTotp(page, SUPERADMIN_EMAIL, secret);
  const session = await apiSession(page.request);
  if (!session.authenticated) {
    console.log("EVENTS\n" + (await keycloakEvents()).join("\n"));
  }
  expect(session.authenticated).toBe(true);
  expect(session.user.role).toBe("SuperAdmin");
  await context.close();
});

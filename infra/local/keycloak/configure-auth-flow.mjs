// Creates the Manada browser authentication flow with native Keycloak 26 step-up for privileged roles.
//
// Flow structure (browser flow copy "manada-browser-mfa"):
//   forms
//     Username Password Form            REQUIRED
//     Privileged assurance (sub-flow)   REQUIRED
//       Condition - user role           REQUIRED  (superadmin, admin)
//       Condition - level of auth. 2    REQUIRED  (fires only when the client requests acr_values=2)
//       OTP Form                        REQUIRED  (password-only privileged sign-in cannot pass)
//
// Customers and Staff keep the standard flow. Customers may still use OTP when they configure it.
// The BFF requests acr_values=2 on every login. acr is voluntary, so customers are not blocked.
//
// Usage (from infra/local): node --env-file=.env keycloak/configure-auth-flow.mjs
const base = process.env.KEYCLOAK_URL ?? "http://localhost:8081";
const realm = "manada";
const flowName = "manada-browser-mfa";
const privilegedFlowName = "Privileged assurance";
const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME;
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;

if (!adminUser || !adminPassword) {
  console.error("Missing KEYCLOAK_ADMIN_USERNAME or KEYCLOAK_ADMIN_PASSWORD.");
  process.exit(1);
}

async function token() {
  const body = new URLSearchParams({ grant_type: "password", client_id: "admin-cli", username: adminUser, password: adminPassword });
  const response = await fetch(`${base}/realms/master/protocol/openid-connect/token`, { method: "POST", body });
  if (!response.ok) throw new Error(`Admin sign-in failed (${response.status}).`);
  return (await response.json()).access_token;
}

const accessToken = await token();

async function api(method, path, body) {
  const response = await fetch(`${base}/admin/realms/${realm}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 204 && response.status !== 201) {
    const text = await response.text();
    throw new Error(`${method} ${path} failed (${response.status}): ${text.slice(0, 200)}`);
  }
  if (response.status === 204 || response.status === 201) return null;
  return response.json();
}

async function flowExists(alias) {
  const flows = await api("GET", "/authentication/flows");
  return flows.some((flow) => flow.alias === alias);
}

async function executions(alias) {
  return api("GET", `/authentication/flows/${encodeURIComponent(alias)}/executions`);
}

async function setRequirement(alias, executionId, requirement) {
  await api("PUT", `/authentication/flows/${encodeURIComponent(alias)}/executions`, { id: executionId, requirement });
}

async function addExecution(parentAlias, provider) {
  await api("POST", `/authentication/flows/${encodeURIComponent(parentAlias)}/executions/execution`, { provider });
  const list = await executions(parentAlias);
  return list.filter((e) => e.providerId === provider).at(-1);
}

async function addConfig(executionId, alias, config) {
  await api("POST", `/authentication/executions/${executionId}/config`, { alias, config });
}

async function ensureFlow() {
  if (await flowExists(flowName)) {
    console.log(`Flow ${flowName} already exists; leaving it unchanged.`);
    return;
  }

  await api("POST", "/authentication/flows/browser/copy", { newName: flowName });

  // Sub-flow that holds the privileged assurance requirement, placed inside the password forms sub-flow.
  // Copied sub-flows are renamed by Keycloak, so find the password forms sub-flow of the copy.
  const topLevel = await executions(flowName);
  const formsAlias = topLevel.find((e) => e.authenticationFlow && /forms/i.test(e.displayName)).displayName;
  await api("POST", `/authentication/flows/${encodeURIComponent(formsAlias)}/executions/flow`, {
    alias: privilegedFlowName,
    description: "Requires OTP for privileged roles when level-2 assurance is requested",
    type: "basic-flow",
    provider: "registration-page-form",
  });
  const formsList = await executions(formsAlias);
  const subFlow = formsList.find((e) => e.displayName === privilegedFlowName);
  // CONDITIONAL: the sub-flow runs only when its conditions hold, so customers and staff are not asked for OTP here.
  await setRequirement(formsAlias, subFlow.id, "CONDITIONAL");

  // The privileged sub-flow must run after the username and password form. Lower its priority until it does.
  for (let guard = 0; guard < 5; guard += 1) {
    const current = await executions(formsAlias);
    const subIndex = current.findIndex((e) => e.displayName === privilegedFlowName);
    const passwordIndex = current.findIndex((e) => e.providerId === "auth-username-password-form");
    if (subIndex > passwordIndex) break;
    await api("POST", `/authentication/executions/${current[subIndex].id}/lower-priority`);
  }

  const roleCondition = await addExecution(privilegedFlowName, "conditional-user-role");
  await setRequirement(privilegedFlowName, roleCondition.id, "REQUIRED");
  await addConfig(roleCondition.id, "privileged-roles", { condUserRole: "superadmin,admin", negate: "false" });

  const loaCondition = await addExecution(privilegedFlowName, "conditional-level-of-authentication");
  await setRequirement(privilegedFlowName, loaCondition.id, "REQUIRED");
  await addConfig(loaCondition.id, "level-2", { "loa-condition-level": "2", "loa-max-age": "28800" });

  const otp = await addExecution(privilegedFlowName, "auth-otp-form");
  await setRequirement(privilegedFlowName, otp.id, "REQUIRED");

  console.log(`Created flow ${flowName} with privileged assurance sub-flow.`);
}

await ensureFlow();

// Bind the browser flow to the realm.
const realmRepresentation = await api("GET", "");
await api("PUT", "", { ...realmRepresentation, browserFlow: flowName });
console.log(`Realm browser flow is ${flowName}.`);

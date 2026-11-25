// Sets Keycloak client secrets from environment variables and grants the backend
// service account the minimum realm-management roles for user administration.
// Run once after `docker compose up` with the values from infra/local/.env.
// Secrets are read from the environment only. Nothing is printed.
//
// Usage (from infra/local): node --env-file=.env keycloak/configure-clients.mjs
const base = process.env.KEYCLOAK_URL ?? "http://localhost:8081";
const realm = "manada";
const adminUser = process.env.KEYCLOAK_ADMIN_USERNAME;
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
const bffSecret = process.env.BFF_CLIENT_SECRET;
const backendSecret = process.env.BACKEND_CLIENT_SECRET;

if (!adminUser || !adminPassword || !bffSecret || !backendSecret) {
  console.error("Missing KEYCLOAK_ADMIN_USERNAME, KEYCLOAK_ADMIN_PASSWORD, BFF_CLIENT_SECRET or BACKEND_CLIENT_SECRET.");
  process.exit(1);
}

async function token() {
  const body = new URLSearchParams({ grant_type: "password", client_id: "admin-cli", username: adminUser, password: adminPassword });
  const response = await fetch(`${base}/realms/master/protocol/openid-connect/token`, { method: "POST", body });
  if (!response.ok) throw new Error(`Admin sign-in failed (${response.status}).`);
  return (await response.json()).access_token;
}

async function api(method, path, accessToken, body) {
  const response = await fetch(`${base}/admin/realms/${realm}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 204) throw new Error(`${method} ${path} failed (${response.status}).`);
  return response.status === 204 ? null : response.json();
}

const accessToken = await token();

const clients = await api("GET", "/clients?clientId=manada-bff", accessToken);
const bff = clients[0];
await api("PUT", `/clients/${bff.id}`, accessToken, { ...bff, secret: bffSecret, fullScopeAllowed: false });

// Explicit scope mapping: the BFF client receives only the four Manada realm roles, never full scope.
const manadaRoles = await Promise.all(["superadmin", "admin", "staff", "customer"].map((name) => api("GET", `/roles/${name}`, accessToken)));
await api("POST", `/clients/${bff.id}/scope-mappings/realm`, accessToken, manadaRoles);

// Authentication assurance (acr) is issued only through the standard acr scope.
const acrScope = (await api("GET", "/client-scopes", accessToken)).find((scope) => scope.name === "acr");
if (acrScope) {
  await fetch(`${base}/admin/realms/${realm}/clients/${bff.id}/default-client-scopes/${acrScope.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

const backendClients = await api("GET", "/clients?clientId=manada-backend", accessToken);
const backend = backendClients[0];
await api("PUT", `/clients/${backend.id}`, accessToken, { ...backend, secret: backendSecret, fullScopeAllowed: true });

const serviceUser = await api("GET", `/clients/${backend.id}/service-account-user`, accessToken);
const realmManagement = (await api("GET", "/clients?clientId=realm-management", accessToken))[0];
const wanted = ["manage-users", "view-users", "query-users", "view-realm"];
const roles = await api("GET", `/users/${serviceUser.id}/role-mappings/clients/${realmManagement.id}/available`, accessToken);
const toGrant = roles.filter((role) => wanted.includes(role.name));
if (toGrant.length > 0) {
  await api("POST", `/users/${serviceUser.id}/role-mappings/clients/${realmManagement.id}`, accessToken, toGrant);
}

console.log("Client secrets set and backend service account roles granted.");

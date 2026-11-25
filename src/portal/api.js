/**
 * Browser API client for the authenticated portals. Every request goes to the same origin, so the
 * server-side session cookie is sent and the browser never receives tokens. State-changing requests
 * carry the CSRF token issued by /bff/session.
 */
export class ApiError extends Error {
  constructor(status, title, detail, errors = {}) {
    super(detail || title || "The request failed.");
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.errors = errors;
  }
}

let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token ?? null;
}

async function request(method, path, body) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET") {
    headers["X-CSRF-TOKEN"] = csrfToken ?? "";
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.title, data?.detail, data?.errors ?? {});
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body ?? {}),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("POST", path, {}),
};

/** Reads the signed-in user, permissions and CSRF token. Anonymous callers receive authenticated=false. */
export function loadSession() {
  return api.get("/bff/session");
}

/** Ends the server-side session and returns the URL to continue to. */
export async function logout() {
  const result = await api.post("/bff/logout", {});
  return result?.redirectUrl ?? "/";
}

/** Display text for a failed request. Server messages are written to be safe to show. */
export function errorMessage(error) {
  if (!(error instanceof ApiError)) {
    return "The service could not be reached. Check your connection and try again.";
  }
  if (error.status === 409) {
    return `${error.message} Reload the page to see the latest version.`;
  }
  if (error.status === 403) {
    return "You do not have permission to do this.";
  }
  if (error.status === 404) {
    return "The requested record was not found.";
  }
  return error.message;
}

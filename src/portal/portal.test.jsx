import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApiError, api, errorMessage, setCsrfToken } from "./api";
import { SessionContext } from "./SessionContext";
import RequirePortal from "./RequirePortal";
import AdministratorsPage from "./superadmin/Administrators";

/*
 * Component-level tests with mocked API responses. They are isolated development fixtures and do not
 * count as real browser authentication. Browser verification runs against the integrated application.
 */

function withSession(value, children) {
  return <SessionContext.Provider value={{ refresh: () => {}, ...value }}>{children}</SessionContext.Provider>;
}

describe("api client", () => {
  beforeEach(() => {
    setCsrfToken("token-123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the CSRF token on state-changing requests only", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await api.get("/api/me");
    await api.post("/api/me/sessions/abc/revoke", {});

    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-TOKEN"]).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("token-123");
    expect(fetchMock.mock.calls[1][1].credentials).toBe("same-origin");
  });

  it("maps a problem response to an ApiError with the server message and field errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ title: "Invalid request", detail: "Name is required.", errors: { name: ["Required"] } }),
        { status: 422, headers: { "Content-Type": "application/problem+json" } },
      ),
    );

    const error = await api.put("/api/admin/organization", { name: "" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.errors.name).toEqual(["Required"]);
    expect(errorMessage(error)).toBe("Name is required.");
  });

  it("explains a conflict and asks the user to reload", () => {
    const error = new ApiError(409, "Conflict", "The account was changed by someone else.");
    expect(errorMessage(error)).toMatch(/Reload the page/);
  });

  it("never exposes an unexpected network failure as a raw error", () => {
    expect(errorMessage(new TypeError("Failed to fetch"))).toMatch(/could not be reached/);
  });
});

describe("RequirePortal", () => {
  it("asks anonymous visitors to sign in and does not render the page", () => {
    render(withSession({ status: "anonymous" }, <RequirePortal><p>Secret page</p></RequirePortal>));

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
  });

  it("shows access denied when the role does not match", () => {
    render(
      withSession(
        { status: "ready", user: { role: "Customer", displayName: "A" }, permissions: [] },
        <RequirePortal requiredRole="SuperAdmin"><p>Admin content</p></RequirePortal>,
      ),
    );

    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders the page for the correct role and permission", () => {
    render(
      withSession(
        { status: "ready", user: { role: "SuperAdmin", displayName: "A" }, permissions: ["audit.read"] },
        <RequirePortal requiredRole="SuperAdmin" permission="audit.read"><p>Audit content</p></RequirePortal>,
      ),
    );

    expect(screen.getByText("Audit content")).toBeInTheDocument();
  });

  it("offers a retry when the session cannot be checked", () => {
    const refresh = vi.fn();
    render(withSession({ status: "error", refresh }, <RequirePortal><p>unused</p></RequirePortal>));

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
  });
});

describe("Administrators screen", () => {
  beforeEach(() => {
    setCsrfToken("token-abc");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while the administrator list is requested", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    render(<AdministratorsPage />);

    expect(screen.getByText("Loading administrators")).toBeInTheDocument();
  });

  it("shows an empty state when there are no administrators", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], page: 1, pageSize: 50, totalCount: 0 }), { status: 200 }),
    );
    render(<AdministratorsPage />);

    expect(await screen.findByText("No administrators yet")).toBeInTheDocument();
  });

  it("shows the server message when the list cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ title: "Forbidden", detail: "You do not have permission to perform this action." }), {
        status: 403,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );
    render(<AdministratorsPage />);

    expect(await screen.findByText("You do not have permission to do this.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("validates the create form before calling the API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], page: 1, pageSize: 50, totalCount: 0 }), { status: 200 }),
    );
    render(<AdministratorsPage />);
    await screen.findByText("No administrators yet");

    fireEvent.click(screen.getByRole("button", { name: "Create administrator" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter the full name.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("creates an administrator through the API and reports the invitation result", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: 1, pageSize: 50, totalCount: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "1" }, invitationSent: true }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: 1, pageSize: 50, totalCount: 0 }), { status: 200 }));
    render(<AdministratorsPage />);
    await screen.findByText("No administrators yet");

    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: "new.admin@manada.test" } });
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "New Admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Create administrator" }));

    expect(await screen.findByText("Administrator created. An invitation email was sent.")).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post[1].headers["X-CSRF-TOKEN"]).toBe("token-abc");
    expect(JSON.parse(post[1].body)).toMatchObject({ email: "new.admin@manada.test", role: "Admin" });
  });
});

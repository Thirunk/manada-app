import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { setCsrfToken } from "./api";
import { SessionContext } from "./SessionContext";
import AccountList from "./shared/AccountList";
import CustomerDashboardPage from "./customer/Dashboard";
import PortalFrame from "./PortalFrame";
import { PermissionCodes } from "./permissions";

/*
 * Component tests with a mocked API. These are development fixtures only; they are not browser
 * certification and do not prove the real sign-in flow.
 */

const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

function ready(user, permissions) {
  return { status: "ready", user, permissions, refresh: () => {} };
}

describe("AccountList search and paging", () => {
  beforeEach(() => setCsrfToken("t"));
  afterEach(() => vi.restoreAllMocks());

  it("sends the role, page size and search term to the server and never filters in the browser", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json({ items: [{ id: "a1", email: "x@manada.test", displayName: "Xavier", status: "Active", rowVersion: 1 }], page: 1, pageSize: 25, totalCount: 1 }),
    );

    render(<MemoryRouter><AccountList accountRole="Staff" caption="Staff accounts" emptyTitle="None" /></MemoryRouter>);
    await screen.findByText("Xavier");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  xav " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByText("Xavier");
    const lastUrl = fetchMock.mock.calls.at(-1)[0];
    expect(lastUrl).toContain("role=Staff");
    expect(lastUrl).toContain("pageSize=25");
    expect(lastUrl).toContain("search=xav");
    expect(lastUrl).toContain("page=1");
  });

  it("shows the server total and moves between pages", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => json({ items: [{ id: "a", email: "a@t", displayName: "A", status: "Active", rowVersion: 1 }], page: 1, pageSize: 25, totalCount: 30 }))
      .mockImplementationOnce(async () => json({ items: [{ id: "b", email: "b@t", displayName: "B", status: "Active", rowVersion: 1 }], page: 2, pageSize: 25, totalCount: 30 }));

    render(<MemoryRouter><AccountList accountRole="Customer" caption="Customer accounts" emptyTitle="None" /></MemoryRouter>);
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(fetchMock.mock.calls.at(-1)[0]).toContain("page=2");
  });

  it("shows the empty-search message when a search has no matches", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json({ items: [], page: 1, pageSize: 25, totalCount: 0 }));

    render(<MemoryRouter><AccountList accountRole="Customer" caption="Customer accounts" emptyTitle="No customers yet" /></MemoryRouter>);
    expect(await screen.findByText("No customers yet")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No matches for this search")).toBeInTheDocument();
  });
});

describe("Customer dashboard", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the account from the database and names unavailable modules without figures", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json({ id: "c1", email: "c@manada.test", displayName: "Customer One", role: "Customer", status: "Active", lastSignInUtc: null, rowVersion: 1, phone: null, companyName: "Acme" }),
    );

    render(
      <SessionContext.Provider value={ready({ role: "Customer", displayName: "Customer One" }, [PermissionCodes.CustomerSelf])}>
        <MemoryRouter><CustomerDashboardPage /></MemoryRouter>
      </SessionContext.Provider>,
    );

    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getAllByText("Not available in this release")).toHaveLength(3);
  });
});

describe("Portal navigation", () => {
  it("shows staff only the pages their permissions allow", () => {
    const items = [
      { path: "", label: "Dashboard" },
      { path: "profile", label: "Profile", permission: PermissionCodes.ProfileSelf },
      { path: "staff", label: "Staff", permission: PermissionCodes.UsersManageStaff },
    ];

    render(
      <SessionContext.Provider value={ready({ role: "Staff", displayName: "Tech" }, [PermissionCodes.ProfileSelf])}>
        <MemoryRouter>
          <PortalFrame title="Staff" basePath="/portal/staff" items={items} />
        </MemoryRouter>
      </SessionContext.Provider>,
    );

    const nav = screen.getByRole("navigation", { name: "Staff sections" });
    expect(nav).toHaveTextContent("Dashboard");
    expect(nav).toHaveTextContent("Profile");
    expect(nav).not.toHaveTextContent("Staff");
  });
});

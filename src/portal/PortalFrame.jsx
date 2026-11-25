import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { errorMessage, logout } from "./api";
import { useSession } from "./SessionContext";

const navLinkClass = ({ isActive }) =>
  [
    "block rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100",
    isActive ? "bg-navy/10 font-semibold text-navy" : "text-body",
  ].join(" ");

/**
 * Shared layout for every portal. Navigation items are filtered by permission, so a user is not shown
 * links to pages they cannot open. Hiding a link is a convenience only; the API enforces access.
 */
export default function PortalFrame({ title, basePath, items }) {
  const session = useSession();
  const [signOutError, setSignOutError] = useState("");
  const permissions = session.permissions ?? [];
  const visible = items.filter((item) => !item.permission || permissions.includes(item.permission));

  async function handleSignOut() {
    setSignOutError("");
    try {
      const next = await logout();
      window.location.assign(next);
    } catch (error) {
      setSignOutError(errorMessage(error));
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[14rem_1fr] sm:px-6">
      <aside aria-label={`${title} navigation`} className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
          <p className="mt-1 text-sm text-body">{session.user?.displayName}</p>
          <p className="text-xs text-muted">{session.user?.role}</p>
        </div>
        <nav aria-label={`${title} sections`}>
          <ul className="space-y-1">
            {visible.map((item) => (
              <li key={item.path || "overview"}>
                <NavLink
                  to={item.path ? `${basePath}/${item.path}` : basePath}
                  end={!item.path}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2">
          <button type="button" className="btn-secondary w-full" onClick={handleSignOut}>
            Sign out
          </button>
          {signOutError ? (
            <p role="alert" className="text-sm font-semibold text-danger">
              {signOutError}
            </p>
          ) : null}
          <Link to="/" className="block text-sm text-muted underline">
            Back to website
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

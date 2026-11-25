import { useState } from "react";
import StatePanel from "../ui/StatePanel";
import { useSession } from "./SessionContext";
import { errorMessage, logout } from "./api";

/**
 * Gate for a portal. Shows a loading, sign-in, error or access-denied state instead of the page
 * when the caller lacks the role or permission. The server still enforces every API call.
 */
export default function RequirePortal({ requiredRole, permission, children }) {
  const session = useSession();
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSignOutError("");
    try {
      const next = await logout();
      window.location.assign(next);
    } catch (error) {
      setSignOutError(errorMessage(error));
    }
  }

  if (session.status === "loading") {
    return (
      <StatePanel
        variant="loading"
        title="Checking your session"
        titleAs="h1"
      />
    );
  }

  if (session.status === "error") {
    return (
      <StatePanel
        variant="error"
        title="We could not check your session"
        titleAs="h1"
      >
        <p>Try again. If the problem continues, contact Manada.</p>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={session.refresh}
        >
          Try again
        </button>
      </StatePanel>
    );
  }

  if (session.status === "anonymous") {
    const returnUrl = encodeURIComponent(window.location.pathname);
    return (
      <StatePanel variant="info" title="Sign in required" titleAs="h1">
        <p>Sign in to open this portal.</p>
        <a
          className="btn-primary mt-4 inline-flex"
          href={`/bff/login?returnUrl=${returnUrl}`}
        >
          Sign in
        </a>
      </StatePanel>
    );
  }

  const denied =
    (requiredRole && session.user.role !== requiredRole) ||
    (permission && !session.permissions.includes(permission));

  if (denied) {
    return (
      <StatePanel variant="error" title="Access denied" titleAs="h1">
        <p>Your account does not have access to this page.</p>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={handleSignOut}
        >
          Sign out
        </button>
        {signOutError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger">
            {signOutError}
          </p>
        ) : null}
      </StatePanel>
    );
  }

  return children;
}

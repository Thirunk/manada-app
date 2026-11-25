import { useCallback, useEffect, useMemo, useState } from "react";
import { loadSession, setCsrfToken } from "./api";
import { SessionContext } from "./SessionContext";

/**
 * Loads the server-side session. The status is loading, anonymous, error or ready.
 * Permissions come from the database through the API; the browser does not decide them.
 */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ status: "loading" });

  // Resolves the session without setting state synchronously, so it is safe to call from an effect.
  const load = useCallback(() => {
    loadSession()
      .then((session) => {
        if (!session?.authenticated) {
          setCsrfToken(null);
          setState({ status: "anonymous" });
          return;
        }
        setCsrfToken(session.csrfToken);
        setState({ status: "ready", user: session.user, permissions: session.permissions ?? [] });
      })
      .catch(() => setState({ status: "error" }));
  }, []);

  // Explicit retry from a user action may show the loading state before resolving.
  const refresh = useCallback(() => {
    setState({ status: "loading" });
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * The signed-in user's own sessions. Only an opaque handle is sent to the browser; the cookie key never is.
 * Revoking another account's session is rejected by the server, so this list only ever shows the caller's own.
 */
export default function SessionsPanel() {
  const [sessions, setSessions] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/api/me/sessions")
      .then((items) => {
        if (active) setSessions(items);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function revoke(handle) {
    setError("");
    setNotice("");
    try {
      await api.post(`/api/me/sessions/${handle}/revoke`, {});
      setNotice("Session revoked.");
      setSessions(null);
      setReloadKey((key) => key + 1);
    } catch (revokeError) {
      setError(errorMessage(revokeError));
    }
  }

  return (
    <section aria-labelledby="sessions-heading" className="space-y-4">
      <h2 id="sessions-heading" className="font-semibold text-navy">Your sessions</h2>
      {notice ? <p role="status" className="text-sm font-semibold text-success">{notice}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
      {sessions === null && !error ? (
        <StatePanel variant="loading" title="Loading sessions" />
      ) : sessions === null ? null : sessions.length === 0 ? (
        <StatePanel variant="empty" title="No active sessions" />
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.handle} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <span className="text-sm text-body">
                Signed in {formatDate(session.createdUtc)} · expires {formatDate(session.expiresUtc)}
              </span>
              <button type="button" className="btn-secondary" onClick={() => revoke(session.handle)}>
                Revoke session
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

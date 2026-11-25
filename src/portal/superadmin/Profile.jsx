import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Field from "../../ui/Field";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** Personal profile and own sessions. Revoking a session takes effect on that session's next request. */
export default function ProfilePage() {
  usePageMeta({ title: "Profile" });
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadSessions() {
    const items = await api.get("/api/me/sessions");
    setSessions(items);
  }

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/api/me"), api.get("/api/me/sessions")])
      .then(([me, own]) => {
        if (!active) return;
        setUser(me);
        setName(me.displayName);
        setSessions(own);
      })
      .catch((loadError) => active && setError(errorMessage(loadError)));
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!name.trim()) {
      setError("Enter your display name.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put("/api/me/profile", { displayName: name.trim(), phone: null, companyName: null });
      setUser(updated);
      setName(updated.displayName);
      setNotice("Profile saved.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function revoke(handle) {
    setNotice("");
    setError("");
    try {
      await api.post(`/api/me/sessions/${handle}/revoke`, {});
      setNotice("Session revoked.");
      await loadSessions();
    } catch (revokeError) {
      setError(errorMessage(revokeError));
    }
  }

  if (!user && !error) {
    return <StatePanel variant="loading" title="Loading your profile" />;
  }
  if (!user) {
    return (
      <StatePanel variant="error" title="Your profile could not be loaded">
        <p>{error}</p>
      </StatePanel>
    );
  }

  return (
    <section aria-labelledby="profile-heading" className="space-y-10">
      <div>
        <h1 id="profile-heading" className="font-display text-3xl font-bold text-navy">Profile</h1>
        <p className="mt-2 text-body">Your personal details and signed-in sessions.</p>
      </div>

      {notice ? <p role="status" className="text-sm font-semibold text-success">{notice}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}

      <form aria-label="Profile details" className="card max-w-2xl space-y-5 p-6" onSubmit={handleSave} noValidate>
        <Field label="Display name" required error={!name.trim() ? "Enter your display name." : undefined}>
          <input className="field-input" name="displayName" autoComplete="name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} />
        </Field>
        <p className="text-sm text-muted">Email address: {user.email} (changed by an administrator)</p>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving" : "Save profile"}</button>
      </form>

      <section aria-labelledby="sessions-heading" className="space-y-4">
        <h2 id="sessions-heading" className="font-semibold text-navy">Your sessions</h2>
        {sessions === null ? (
          <StatePanel variant="loading" title="Loading sessions" />
        ) : sessions.length === 0 ? (
          <StatePanel variant="empty" title="No other active sessions" />
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
    </section>
  );
}

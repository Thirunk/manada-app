import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Field from "../../ui/Field";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";

/** Organization settings. Saves send the row version read on load, so an edit from another session is reported, not overwritten. */
export default function OrganizationPage() {
  usePageMeta({ title: "Organization" });
  const [state, setState] = useState({ status: "loading" });
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Reloads come from event handlers via reloadKey, never from a synchronous setState inside an effect.
  function reload() {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let active = true;
    api
      .get("/api/admin/organization")
      .then((organization) => {
        if (!active) return;
        setName(organization.name);
        setState({ status: "ready", organization });
      })
      .catch((loadError) => {
        if (active) setState({ status: "error", message: errorMessage(loadError) });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSave(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!name.trim()) {
      setError("Enter the organization name.");
      return;
    }
    if (name.trim().length > 200) {
      setError("The organization name must be at most 200 characters.");
      return;
    }

    setSaving(true);
    try {
      const organization = await api.put("/api/admin/organization", {
        name: name.trim(),
        rowVersion: state.organization.rowVersion,
      });
      setState({ status: "ready", organization });
      setName(organization.name);
      setNotice("Organization settings saved.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") {
    return <StatePanel variant="loading" title="Loading organization settings" />;
  }
  if (state.status === "error") {
    return (
      <StatePanel variant="error" title="Organization settings could not be loaded">
        <p>{state.message}</p>
        <button type="button" className="btn-secondary mt-4" onClick={reload}>Try again</button>
      </StatePanel>
    );
  }

  const { organization } = state;

  return (
    <section aria-labelledby="org-heading" className="space-y-8">
      <div>
        <h1 id="org-heading" className="font-display text-3xl font-bold text-navy">Organization</h1>
        <p className="mt-2 text-body">Organization details used across the portals.</p>
      </div>

      {notice ? <p role="status" className="text-sm font-semibold text-success">{notice}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}

      <form aria-label="Organization settings" className="card max-w-2xl space-y-5 p-6" onSubmit={handleSave} noValidate>
        <Field label="Organization name" required error={!name.trim() ? "Enter the organization name." : undefined}>
          <input className="field-input" name="organizationName" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} />
        </Field>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving" : "Save organization"}
        </button>
      </form>

      <section aria-labelledby="branches-heading" className="space-y-3">
        <h2 id="branches-heading" className="font-semibold text-navy">Branches</h2>
        {organization.branches.length === 0 ? (
          <StatePanel variant="empty" title="No branches have been added">
            <p>Branch management is not part of this release.</p>
          </StatePanel>
        ) : (
          <ul className="space-y-2">
            {organization.branches.map((branch) => (
              <li key={branch.id} className="card p-4 text-sm text-body">
                {branch.name} <span className="text-muted">({branch.code})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

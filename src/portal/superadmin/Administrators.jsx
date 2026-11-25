import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Field from "../../ui/Field";
import StatePanel from "../../ui/StatePanel";
import StatusBadge from "../../ui/StatusBadge";
import { usePageMeta } from "../../hooks/usePageMeta";

const ROLE_OPTIONS = ["Admin", "Staff", "Customer"];

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** Administrator management: list, create, activate or disable, and change role for SuperAdmin. */
export default function AdministratorsPage() {
  usePageMeta({ title: "Administrators" });

  const [list, setList] = useState({ status: "loading", items: [], total: 0 });
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({ email: "", fullName: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  // Reloads are requested by bumping reloadKey from an event handler, never by setting state inside an effect.
  const reload = useCallback(() => {
    setList((current) => ({ ...current, status: "loading" }));
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/api/admin/users?role=Admin&page=1&pageSize=50")
      .then((page) => {
        if (active) setList({ status: "ready", items: page.items, total: page.totalCount });
      })
      .catch((error) => {
        if (active) setList({ status: "error", items: [], total: 0, message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function validate() {
    const errors = {};
    if (!form.email.trim() || !form.email.includes("@")) errors.email = "Enter a valid email address.";
    if (!form.fullName.trim()) errors.fullName = "Enter the full name.";
    return errors;
  }

  async function handleCreate(event) {
    event.preventDefault();
    setNotice(null);
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const result = await api.post("/api/admin/users", {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: "Admin",
        jobTitle: null,
        branchCode: null,
      });
      setForm({ email: "", fullName: "" });
      setNotice({
        tone: "success",
        text: result.invitationSent
          ? "Administrator created. An invitation email was sent."
          : "Administrator created, but the invitation email could not be sent. Try again later.",
      });
      reload();
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(user) {
    setNotice(null);
    setBusyId(user.id);
    try {
      await api.put(`/api/admin/users/${user.id}/status`, {
        active: user.status !== "Active",
        rowVersion: user.rowVersion,
      });
      setNotice({ tone: "success", text: `${user.email} was ${user.status === "Active" ? "disabled" : "activated"}.` });
      reload();
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(user, role) {
    setNotice(null);
    setBusyId(user.id);
    try {
      await api.put(`/api/admin/users/${user.id}/role`, { role, rowVersion: user.rowVersion });
      setNotice({ tone: "success", text: `${user.email} is now ${role}.` });
      reload();
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="admins-heading" className="space-y-8">
      <div>
        <h1 id="admins-heading" className="font-display text-3xl font-bold text-navy">
          Administrators
        </h1>
        <p className="mt-2 text-body">
          Create administrator accounts and control their access. Accounts cannot change their own status or role.
        </p>
      </div>

      {notice ? (
        <div role={notice.tone === "error" ? "alert" : "status"} className={notice.tone === "error" ? "rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm font-semibold text-danger" : "rounded-lg border border-success/30 bg-success/5 p-4 text-sm font-semibold text-success"}>
          {notice.text}
        </div>
      ) : null}

      <form aria-label="Create administrator" className="card max-w-2xl space-y-5 p-6" onSubmit={handleCreate} noValidate>
        <h2 className="font-semibold text-navy">Create an administrator</h2>
        <Field label="Email address" required error={formErrors.email}>
          <input
            className="field-input"
            type="email"
            name="email"
            autoComplete="off"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Full name" required error={formErrors.fullName}>
          <input
            className="field-input"
            name="fullName"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </Field>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Creating" : "Create administrator"}
        </button>
      </form>

      {list.status === "loading" ? (
        <StatePanel variant="loading" title="Loading administrators" />
      ) : list.status === "error" ? (
        <StatePanel variant="error" title="Administrators could not be loaded">
          <p>{list.message}</p>
          <button type="button" className="btn-secondary mt-4" onClick={reload}>
            Try again
          </button>
        </StatePanel>
      ) : list.items.length === 0 ? (
        <StatePanel variant="empty" title="No administrators yet">
          <p>Create the first administrator above.</p>
        </StatePanel>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <caption className="px-4 py-3 text-left font-semibold text-navy">
              Administrator accounts ({list.total})
            </caption>
            <thead className="bg-canvas">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-navy">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold text-navy">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold text-navy">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold text-navy">Last sign-in</th>
                <th scope="col" className="px-4 py-3 font-semibold text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.items.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-body">{user.displayName}</td>
                  <td className="px-4 py-3 text-body">{user.email}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(user.lastSignInUtc)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busyId === user.id}
                        onClick={() => changeStatus(user)}
                      >
                        {user.status === "Active" ? `Disable ${user.email}` : `Activate ${user.email}`}
                      </button>
                      <label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.email}</label>
                      <select
                        id={`role-${user.id}`}
                        className="field-input py-1"
                        defaultValue="Admin"
                        disabled={busyId === user.id}
                        onChange={(event) => changeRole(user, event.target.value)}
                      >
                        <option value="Admin" disabled>Admin</option>
                        {ROLE_OPTIONS.filter((role) => role !== "Admin").map((role) => (
                          <option key={role} value={role}>Change to {role}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

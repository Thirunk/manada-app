import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import Field from "../../ui/Field";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountFacts from "./AccountFacts";
import SessionsPanel from "./SessionsPanel";

/**
 * Shared profile page for every portal. Reads the caller's own account; updates are limited to the
 * fields the server accepts for the caller's role (display name, and company and phone for customers).
 */
export default function ProfilePage() {
  usePageMeta({ title: "Profile" });
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ displayName: "", phone: "", companyName: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get("/api/me/account")
      .then((me) => {
        if (!active) return;
        setAccount(me);
        setForm({ displayName: me.displayName, phone: me.phone ?? "", companyName: me.companyName ?? "" });
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSave(event) {
    event.preventDefault();
    setNotice("");
    setSaveError("");
    const next = {};
    if (!form.displayName.trim()) next.displayName = "Enter your display name.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await api.put("/api/me/profile", {
        displayName: form.displayName.trim(),
        phone: account.role === "Customer" && form.phone.trim() ? form.phone.trim() : null,
        companyName: account.role === "Customer" && form.companyName.trim() ? form.companyName.trim() : null,
      });
      setNotice("Profile saved.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <StatePanel variant="error" title="Your profile could not be loaded" titleAs="h1">
        <p>{loadError}</p>
      </StatePanel>
    );
  }
  if (!account) {
    return <StatePanel variant="loading" title="Loading your profile" titleAs="h1" />;
  }

  const isCustomer = account.role === "Customer";

  return (
    <section aria-labelledby="profile-heading" className="space-y-10">
      <div>
        <h1 id="profile-heading" className="font-display text-3xl font-bold text-navy">Profile</h1>
        <p className="mt-2 text-body">Your account information and personal details.</p>
      </div>

      <AccountFacts account={account} />

      {notice ? <p role="status" className="text-sm font-semibold text-success">{notice}</p> : null}
      {saveError ? <p role="alert" className="text-sm font-semibold text-danger">{saveError}</p> : null}

      <form aria-label="Edit profile" className="card max-w-2xl space-y-5 p-6" onSubmit={handleSave} noValidate>
        <Field label="Display name" required error={errors.displayName}>
          <input className="field-input" name="displayName" autoComplete="name" maxLength={200} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </Field>
        {isCustomer ? (
          <>
            <Field label="Company name" hint="Optional.">
              <input className="field-input" name="companyName" maxLength={200} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </Field>
            <Field label="Phone number" hint="Optional.">
              <input className="field-input" type="tel" name="phone" autoComplete="tel" maxLength={32} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </>
        ) : null}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving" : "Save profile"}</button>
      </form>

      <SessionsPanel />
    </section>
  );
}

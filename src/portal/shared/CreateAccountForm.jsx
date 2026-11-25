import { useState } from "react";
import { api, errorMessage } from "../api";
import Field from "../../ui/Field";

/**
 * Account creation for one role. The server decides whether the caller may create that role;
 * this form only checks the shape of the input. onCreated runs after a successful save.
 */
export default function CreateAccountForm({ accountRole, noun, showStaffFields = false, onCreated }) {
  const [form, setForm] = useState({ email: "", fullName: "", jobTitle: "", branchCode: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!form.email.trim() || !form.email.includes("@")) next.email = "Enter a valid email address.";
    if (!form.fullName.trim()) next.fullName = "Enter the full name.";
    if (showStaffFields && form.jobTitle.trim().length > 120) next.jobTitle = "Job title must be at most 120 characters.";
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const result = await api.post("/api/admin/users", {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: accountRole,
        jobTitle: showStaffFields && form.jobTitle.trim() ? form.jobTitle.trim() : null,
        branchCode: showStaffFields && form.branchCode.trim() ? form.branchCode.trim() : null,
      });
      setForm({ email: "", fullName: "", jobTitle: "", branchCode: "" });
      setNotice({
        tone: "success",
        text: result.invitationSent
          ? `${noun} created. An invitation email was sent.`
          : `${noun} created, but the invitation email could not be sent. Try again later.`,
      });
      onCreated?.();
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p role={notice.tone === "error" ? "alert" : "status"} className={notice.tone === "error" ? "text-sm font-semibold text-danger" : "text-sm font-semibold text-success"}>
          {notice.text}
        </p>
      ) : null}
      <form aria-label={`Create ${noun.toLowerCase()}`} className="card max-w-2xl space-y-5 p-6" onSubmit={handleSubmit} noValidate>
        <h2 className="font-semibold text-navy">Create a {noun.toLowerCase()}</h2>
        <Field label="Email address" required error={errors.email}>
          <input className="field-input" type="email" name="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Full name" required error={errors.fullName}>
          <input className="field-input" name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        {showStaffFields ? (
          <>
            <Field label="Job title" hint="Optional. Shown on the staff member's profile." error={errors.jobTitle}>
              <input className="field-input" name="jobTitle" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </Field>
            <Field label="Branch code" hint="Optional. Must match an existing branch code.">
              <input className="field-input" name="branchCode" value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} />
            </Field>
          </>
        ) : null}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Creating" : `Create ${noun.toLowerCase()}`}</button>
      </form>
    </div>
  );
}

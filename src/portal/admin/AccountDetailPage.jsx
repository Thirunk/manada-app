import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountFacts from "../shared/AccountFacts";

/**
 * One account within the caller's scope. Accounts outside the scope return not found from the API,
 * so this page shows the same message whether the account is missing or out of scope.
 */
export default function AccountDetailPage() {
  usePageMeta({ title: "Account" });
  const { id } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/api/admin/users/${id}`)
      .then((account) => {
        if (active) setState({ status: "ready", account });
      })
      .catch((error) => {
        if (active) setState({ status: "error", notFound: error.status === 404, message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  async function toggleStatus() {
    const account = state.account;
    setNotice(null);
    setSaving(true);
    try {
      await api.put(`/api/admin/users/${account.id}/status`, { active: account.status !== "Active", rowVersion: account.rowVersion });
      setNotice({ tone: "success", text: account.status === "Active" ? "Account disabled." : "Account activated." });
      setState({ status: "loading" });
      setReloadKey((key) => key + 1);
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="account-heading" className="space-y-8">
      <Link className="text-sm font-semibold text-navy underline" to="/portal/admin">Back to dashboard</Link>

      {state.status === "loading" ? (
        <StatePanel variant="loading" title="Loading account" titleAs="h1" />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title={state.notFound ? "Account not found" : "The account could not be loaded"} titleAs="h1">
          <p>{state.notFound ? "The account does not exist or is outside your responsibilities." : state.message}</p>
        </StatePanel>
      ) : (
        <>
          <div>
            <h1 id="account-heading" className="font-display text-3xl font-bold text-navy">{state.account.displayName}</h1>
            <p className="mt-2 text-body">{state.account.role} account</p>
          </div>
          <AccountFacts account={state.account} />
          {notice ? (
            <p role={notice.tone === "error" ? "alert" : "status"} className={notice.tone === "error" ? "text-sm font-semibold text-danger" : "text-sm font-semibold text-success"}>
              {notice.text}
            </p>
          ) : null}
          <button type="button" className="btn-secondary" disabled={saving} onClick={toggleStatus}>
            {state.account.status === "Active" ? "Disable account" : "Activate account"}
          </button>
        </>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";

const PAGE_SIZE = 25;

function formatDate(value) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" });
}

/** Security audit events, newest first. Read-only: the audit table is append-only in the database. */
export default function AuditLogPage() {
  usePageMeta({ title: "Security audit log" });
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState("");
  const [state, setState] = useState({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  // Changing filters or retrying sets loading in the handler; the effect only reads the API.
  function reload() {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  function changeOutcome(value) {
    setOutcome(value);
    setPage(1);
    setState({ status: "loading" });
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (outcome) params.set("outcome", outcome);
    api
      .get(`/api/admin/audit?${params.toString()}`)
      .then((result) => {
        if (active) setState({ status: "ready", result });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [page, outcome, reloadKey]);

  return (
    <section aria-labelledby="audit-heading" className="space-y-6">
      <div>
        <h1 id="audit-heading" className="font-display text-3xl font-bold text-navy">Security audit log</h1>
        <p className="mt-2 text-body">Sign-ins, role and status changes, and denied actions. Newest events first.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1.5 text-sm font-semibold text-navy">
          Outcome
          <select className="field-input mt-1.5 block" value={outcome} onChange={(event) => changeOutcome(event.target.value)}>
            <option value="">All outcomes</option>
            <option value="Success">Success</option>
            <option value="Denied">Denied</option>
            <option value="Failed">Failed</option>
          </select>
        </label>
      </div>

      {state.status === "loading" ? (
        <StatePanel variant="loading" title="Loading audit events" />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title="Audit events could not be loaded">
          <p>{state.message}</p>
          <button type="button" className="btn-secondary mt-4" onClick={reload}>Try again</button>
        </StatePanel>
      ) : state.result.items.length === 0 ? (
        <StatePanel variant="empty" title="No audit events match this view" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <caption className="px-4 py-3 text-left font-semibold text-navy">Audit events</caption>
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">When</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Action</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Outcome</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Target</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.result.items.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(event.occurredUtc)}</td>
                    <td className="px-4 py-3 text-body">{event.action}</td>
                    <td className="px-4 py-3 text-body">{event.outcome}</td>
                    <td className="px-4 py-3 text-body">{event.targetType ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{event.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Audit log pages" className="flex items-center gap-3">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="text-sm text-body">Page {state.result.page} · {state.result.totalCount} events</span>
            <button
              type="button"
              className="btn-secondary"
              disabled={page * PAGE_SIZE >= state.result.totalCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}

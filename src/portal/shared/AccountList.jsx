import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import StatusBadge from "../../ui/StatusBadge";

const PAGE_SIZE = 25;

function Notice({ notice }) {
  if (!notice) return null;
  return notice.tone === "error" ? (
    <p role="alert" className="text-sm font-semibold text-danger">{notice.text}</p>
  ) : (
    <p role="status" className="text-sm font-semibold text-success">{notice.text}</p>
  );
}

/**
 * Server-paginated, searchable list of accounts for one role. The server applies the scope
 * (for example Admin sees Staff and Customer only), so the list is never filtered in the browser.
 * refreshKey lets a parent request a reload after it creates an account.
 */
export default function AccountList({
  accountRole,
  caption,
  emptyTitle,
  detailBase,
  roleOptions = [],
  refreshKey = 0,
}) {
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [draftSearch, setDraftSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading" });
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ role: accountRole, page: String(query.page), pageSize: String(PAGE_SIZE) });
    if (query.search) params.set("search", query.search);
    api
      .get(`/api/admin/users?${params.toString()}`)
      .then((result) => {
        if (active) setState({ status: "ready", result });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [accountRole, query, reloadKey, refreshKey]);

  // Event handlers set loading and bump the key, so effects never set state synchronously.
  function reload() {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setState({ status: "loading" });
    setQuery({ search: draftSearch.trim(), page: 1 });
  }

  function goToPage(page) {
    setState({ status: "loading" });
    setQuery((current) => ({ ...current, page }));
  }

  async function toggleStatus(user) {
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

  async function changeRole(user, nextRole) {
    setNotice(null);
    setBusyId(user.id);
    try {
      await api.put(`/api/admin/users/${user.id}/role`, { role: nextRole, rowVersion: user.rowVersion });
      setNotice({ tone: "success", text: `${user.email} is now ${nextRole}.` });
      reload();
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  const page = state.result;
  const totalPages = page ? Math.max(1, Math.ceil(page.totalCount / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <form role="search" aria-label={`Search ${caption.toLowerCase()}`} className="flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
        <label className="space-y-1.5 text-sm font-semibold text-navy">
          Search by name or email
          <input className="field-input mt-1.5 block" type="search" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} />
        </label>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <Notice notice={notice} />

      {state.status === "loading" ? (
        <StatePanel variant="loading" title={`Loading ${caption.toLowerCase()}`} />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title={`${caption} could not be loaded`}>
          <p>{state.message}</p>
          <button type="button" className="btn-secondary mt-4" onClick={reload}>Try again</button>
        </StatePanel>
      ) : page.items.length === 0 ? (
        <StatePanel variant="empty" title={query.search ? "No matches for this search" : emptyTitle} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <caption className="px-4 py-3 text-left font-semibold text-navy">{caption} ({page.totalCount})</caption>
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Email</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.items.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-body">
                      {detailBase ? <Link className="font-semibold text-navy underline" to={`${detailBase}/${user.id}`}>{user.displayName}</Link> : user.displayName}
                    </td>
                    <td className="px-4 py-3 text-body">{user.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="btn-secondary" disabled={busyId === user.id} onClick={() => toggleStatus(user)}>
                          {user.status === "Active" ? `Disable ${user.email}` : `Activate ${user.email}`}
                        </button>
                        {roleOptions.length > 0 ? (
                          <>
                            <label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.email}</label>
                            <select
                              id={`role-${user.id}`}
                              className="field-input py-1"
                              value={accountRole}
                              disabled={busyId === user.id}
                              onChange={(event) => changeRole(user, event.target.value)}
                            >
                              <option value={accountRole} disabled>{accountRole}</option>
                              {roleOptions.map((option) => (
                                <option key={option} value={option}>Change to {option}</option>
                              ))}
                            </select>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label={`${caption} pages`} className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-secondary" disabled={page.page <= 1} onClick={() => goToPage(page.page - 1)}>Previous</button>
            <span className="text-sm text-body">Page {page.page} of {totalPages}</span>
            <button type="button" className="btn-secondary" disabled={page.page >= totalPages} onClick={() => goToPage(page.page + 1)}>Next</button>
          </nav>
        </>
      )}
    </div>
  );
}

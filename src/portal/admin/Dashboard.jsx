import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useSession } from "../SessionContext";

const COUNTED = [
  { role: "Staff", label: "Staff accounts", to: "/portal/admin/staff" },
  { role: "Customer", label: "Customer accounts", to: "/portal/admin/customers" },
];

/** Admin dashboard. Counts come from the database through the scoped list endpoint. */
export default function AdminDashboardPage() {
  usePageMeta({ title: "Admin dashboard" });
  const session = useSession();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    Promise.all(COUNTED.map((item) => api.get(`/api/admin/users?role=${item.role}&page=1&pageSize=1`).then((page) => [item.role, page.totalCount])))
      .then((entries) => {
        if (active) setState({ status: "ready", counts: Object.fromEntries(entries) });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-8">
      <div>
        <h1 id="dashboard-heading" className="font-display text-3xl font-bold text-navy">Welcome, {session.user.displayName}</h1>
        <p className="mt-2 text-body">Accounts you manage. Administrator accounts are managed by the SuperAdmin.</p>
      </div>

      {state.status === "loading" ? (
        <StatePanel variant="loading" title="Loading account counts" />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title="Account counts could not be loaded">
          <p>{state.message}</p>
        </StatePanel>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          {COUNTED.map((item) => (
            <div key={item.role} className="card p-5">
              <dt className="text-sm font-semibold text-body">{item.label}</dt>
              <dd className="mt-3 font-display text-3xl font-bold text-navy">{state.counts[item.role]}</dd>
              <dd className="mt-3"><Link className="text-sm font-semibold text-navy underline" to={item.to}>Open list</Link></dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

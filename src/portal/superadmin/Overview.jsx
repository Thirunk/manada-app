import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useSession } from "../SessionContext";

const COUNTED_ROLES = ["Admin", "Staff", "Customer"];

/** Overview with counts read from the database. No figure is shown unless the API returned it. */
export default function OverviewPage() {
  usePageMeta({ title: "SuperAdmin overview" });
  const session = useSession();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    Promise.all(
      COUNTED_ROLES.map((role) =>
        api.get(`/api/admin/users?role=${role}&page=1&pageSize=1`).then((page) => [role, page.totalCount]),
      ),
    )
      .then((entries) => active && setState({ status: "ready", counts: Object.fromEntries(entries) }))
      .catch((error) => active && setState({ status: "error", message: errorMessage(error) }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="overview-heading" className="space-y-8">
      <div>
        <h1 id="overview-heading" className="font-display text-3xl font-bold text-navy">
          Welcome, {session.user.displayName}
        </h1>
        <p className="mt-2 text-body">Account counts from the Manada database.</p>
      </div>

      {state.status === "loading" ? (
        <StatePanel variant="loading" title="Loading account counts" />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title="Account counts could not be loaded">
          <p>{state.message}</p>
        </StatePanel>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-3">
          {COUNTED_ROLES.map((role) => (
            <div key={role} className="card p-5">
              <dt className="text-sm font-semibold text-body">{role} accounts</dt>
              <dd className="mt-3 font-display text-3xl font-bold text-navy">{state.counts[role]}</dd>
            </div>
          ))}
        </dl>
      )}

      <nav aria-label="Quick links" className="flex flex-wrap gap-3">
        <Link className="btn-secondary" to="/portal/superadmin/administrators">Manage administrators</Link>
        <Link className="btn-secondary" to="/portal/superadmin/audit">View audit log</Link>
      </nav>
    </section>
  );
}

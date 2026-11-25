import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";

/** Read-only role-permission matrix. Changing grants is not available in M3; the API exposes no write endpoint. */
export default function RolesPage() {
  usePageMeta({ title: "Roles and permissions" });
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    api
      .get("/api/admin/roles/matrix")
      .then((matrix) => active && setState({ status: "ready", matrix }))
      .catch((error) => active && setState({ status: "error", message: errorMessage(error) }));
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return <StatePanel variant="loading" title="Loading the role matrix" />;
  }
  if (state.status === "error") {
    return (
      <StatePanel variant="error" title="The role matrix could not be loaded">
        <p>{state.message}</p>
      </StatePanel>
    );
  }

  const { roles, permissions, grants } = state.matrix;
  const granted = new Set(grants.map((g) => `${g.role}:${g.permissionCode}`));

  return (
    <section aria-labelledby="roles-heading" className="space-y-6">
      <div>
        <h1 id="roles-heading" className="font-display text-3xl font-bold text-navy">
          Roles and permissions
        </h1>
        <p className="mt-2 text-body">
          The permissions each role holds. Access is checked on the server for every request, so this view is for review only.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <caption className="px-4 py-3 text-left font-semibold text-navy">Permission matrix</caption>
          <thead className="bg-canvas">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-navy">Permission</th>
              {roles.map((role) => (
                <th scope="col" key={role} className="whitespace-nowrap px-4 py-3 font-semibold text-navy">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissions.map((permission) => (
              <tr key={permission.code}>
                <th scope="row" className="px-4 py-3 text-left">
                  <span className="block font-semibold text-navy">{permission.code}</span>
                  <span className="block text-xs text-muted">{permission.description}</span>
                </th>
                {roles.map((role) => (
                  <td key={role} className="px-4 py-3 text-body">
                    {granted.has(`${role}:${permission.code}`) ? "Granted" : "Not granted"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

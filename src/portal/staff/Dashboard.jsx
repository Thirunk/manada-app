import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import StatePanel from "../../ui/StatePanel";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountFacts from "../shared/AccountFacts";
import UnavailableModules from "../shared/UnavailableModules";

/** Staff dashboard: account information from the database and the modules that are not yet available. */
export default function StaffDashboardPage() {
  usePageMeta({ title: "Staff dashboard" });
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    api
      .get("/api/me/account")
      .then((account) => {
        if (active) setState({ status: "ready", account });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="staff-dashboard-heading" className="space-y-10">
      <div>
        <h1 id="staff-dashboard-heading" className="font-display text-3xl font-bold text-navy">Staff dashboard</h1>
        <p className="mt-2 text-body">Your account information.</p>
      </div>
      {state.status === "loading" ? (
        <StatePanel variant="loading" title="Loading your account" />
      ) : state.status === "error" ? (
        <StatePanel variant="error" title="Your account could not be loaded">
          <p>{state.message}</p>
        </StatePanel>
      ) : (
        <AccountFacts account={state.account} />
      )}
      <UnavailableModules
        modules={[
          "Product and catalogue management",
          "Inventory",
          "Service requests",
          "Orders",
          "Customer records",
        ]}
      />
    </section>
  );
}

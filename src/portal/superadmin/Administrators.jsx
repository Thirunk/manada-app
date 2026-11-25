import { useState } from "react";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountList from "../shared/AccountList";
import CreateAccountForm from "../shared/CreateAccountForm";

/**
 * Administrator management. The list is paginated and searched on the server. SuperAdmin may move an
 * administrator to Staff or Customer; the server enforces that, and the last active SuperAdmin is protected.
 */
export default function AdministratorsPage() {
  usePageMeta({ title: "Administrators" });
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section aria-labelledby="admins-heading" className="space-y-10">
      <div>
        <h1 id="admins-heading" className="font-display text-3xl font-bold text-navy">Administrators</h1>
        <p className="mt-2 text-body">
          Create administrator accounts and control their access. Accounts cannot change their own status or role.
        </p>
      </div>
      <CreateAccountForm accountRole="Admin" noun="Administrator" onCreated={() => setRefreshKey((key) => key + 1)} />
      <AccountList
        accountRole="Admin"
        caption="Administrator accounts"
        emptyTitle="No administrators yet"
        roleOptions={["Staff", "Customer"]}
        refreshKey={refreshKey}
      />
    </section>
  );
}

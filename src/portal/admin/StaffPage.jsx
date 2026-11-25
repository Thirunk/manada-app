import { useState } from "react";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountList from "../shared/AccountList";
import CreateAccountForm from "../shared/CreateAccountForm";

/** Staff accounts: searchable, paginated list and creation. Staff responsibilities are shown on each account. */
export default function StaffPage() {
  usePageMeta({ title: "Staff" });
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section aria-labelledby="staff-heading" className="space-y-10">
      <div>
        <h1 id="staff-heading" className="font-display text-3xl font-bold text-navy">Staff</h1>
        <p className="mt-2 text-body">Create and manage staff accounts. Select a name to see job title and branch.</p>
      </div>
      <CreateAccountForm accountRole="Staff" noun="Staff member" showStaffFields onCreated={() => setRefreshKey((key) => key + 1)} />
      <AccountList
        accountRole="Staff"
        caption="Staff accounts"
        emptyTitle="No staff accounts yet"
        detailBase="/portal/admin/accounts"
        refreshKey={refreshKey}
      />
    </section>
  );
}

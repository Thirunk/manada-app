import { useState } from "react";
import { usePageMeta } from "../../hooks/usePageMeta";
import AccountList from "../shared/AccountList";
import CreateAccountForm from "../shared/CreateAccountForm";

/** Customer accounts: searchable, paginated list and creation. Customers can see only their own records. */
export default function CustomersPage() {
  usePageMeta({ title: "Customers" });
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section aria-labelledby="customers-heading" className="space-y-10">
      <div>
        <h1 id="customers-heading" className="font-display text-3xl font-bold text-navy">Customers</h1>
        <p className="mt-2 text-body">Create and manage customer accounts.</p>
      </div>
      <CreateAccountForm accountRole="Customer" noun="Customer" onCreated={() => setRefreshKey((key) => key + 1)} />
      <AccountList
        accountRole="Customer"
        caption="Customer accounts"
        emptyTitle="No customer accounts yet"
        detailBase="/portal/admin/accounts"
        refreshKey={refreshKey}
      />
    </section>
  );
}

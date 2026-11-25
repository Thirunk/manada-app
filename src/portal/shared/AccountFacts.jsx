const STATUS_TEXT = {
  Active: "Active",
  PendingVerification: "Waiting for email verification",
  Disabled: "Disabled",
};

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** Read-only account information from the database. Shows only the fields the account is allowed to see. */
export default function AccountFacts({ account }) {
  const rows = [
    ["Email", account.email],
    ["Role", account.role],
    ["Status", STATUS_TEXT[account.status] ?? account.status],
    ["Last sign-in", formatDate(account.lastSignInUtc)],
  ];
  if (account.jobTitle) rows.push(["Job title", account.jobTitle]);
  if (account.branchName) rows.push(["Branch", `${account.branchName} (${account.branchCode})`]);
  if (account.companyName) rows.push(["Company", account.companyName]);
  if (account.phone) rows.push(["Phone", account.phone]);

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="card p-4">
          <dt className="text-sm font-semibold text-body">{label}</dt>
          <dd className="mt-1 text-navy">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

import StatusBadge from "./StatusBadge";

/**
 * Accessible data table. It has a caption, column header scopes, horizontal
 * scrolling on narrow screens, and a text status in each row.
 */
function DataTable({
  caption,
  columns,
  rows,
  emptyMessage = "No records match this view.",
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-canvas">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap px-4 py-3 font-semibold text-navy"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-body"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.reference}>
                <th
                  scope="row"
                  className="whitespace-nowrap px-4 py-3 font-semibold text-navy"
                >
                  {row.reference}
                </th>
                <td className="px-4 py-3 text-body">{row.item}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {row.updated}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

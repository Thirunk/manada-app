/**
 * Business modules that are scheduled for later phases. They are named honestly as unavailable;
 * no records, counts or placeholder data are shown for them.
 */
export default function UnavailableModules({ modules }) {
  return (
    <section aria-labelledby="modules-heading" className="space-y-3">
      <h2 id="modules-heading" className="font-semibold text-navy">Other modules</h2>
      <ul className="space-y-2">
        {modules.map((name) => (
          <li key={name} className="card flex items-center justify-between p-4 text-sm">
            <span className="text-body">{name}</span>
            <span className="text-muted">Not available in this release</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

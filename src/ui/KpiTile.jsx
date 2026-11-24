/**
 * Summary tile. The value is a dash until a backend supplies real figures, so
 * the preview never shows invented business statistics.
 */
function KpiTile({ label }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-body">{label}</p>
      <p
        className="mt-3 font-display text-3xl font-bold text-navy"
        aria-label={`${label}: not available in preview`}
      >
        —
      </p>
      <p className="mt-2 text-xs text-muted">
        Live figures are available after backend integration (M4).
      </p>
    </div>
  );
}

export default KpiTile;

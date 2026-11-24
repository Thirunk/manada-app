const TONES = {
  Active: "bg-success/10 text-success",
  approved: "bg-success/10 text-success",
  Pending: "bg-amber-100 text-warning",
  pending: "bg-amber-100 text-warning",
  Draft: "bg-slate-100 text-muted",
  draft: "bg-slate-100 text-muted",
  Closed: "bg-slate-100 text-muted",
  Attention: "bg-danger/10 text-danger",
};

/** Text-labelled status so colour is never the only signal. */
function StatusBadge({ status }) {
  const tone = TONES[status] ?? "bg-slate-100 text-muted";
  return <span className={`badge ${tone}`}>{status}</span>;
}

export default StatusBadge;

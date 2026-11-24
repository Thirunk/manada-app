/**
 * Consistent loading, empty, error, success and info states.
 * Error and success use role="alert" and role="status" so screen readers
 * announce them. Loading is a polite status region with a text alternative.
 */
const TONES = {
  empty: "border-slate-200 bg-white text-body",
  info: "border-teal/30 bg-teal/5 text-body",
  success: "border-success/30 bg-success/5 text-body",
  error: "border-danger/30 bg-danger/5 text-body",
  loading: "border-slate-200 bg-white text-body",
};

function StatePanel({
  variant = "empty",
  title,
  titleAs: TitleTag = "p",
  children,
  action,
}) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-busy={variant === "loading" ? "true" : undefined}
      className={`rounded-lg border p-6 ${TONES[variant]}`}
    >
      {variant === "loading" ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        </div>
      ) : null}
      {title ? (
        <TitleTag className="font-semibold text-navy">{title}</TitleTag>
      ) : null}
      {children ? (
        <div className="mt-2 text-sm leading-6">{children}</div>
      ) : null}
      {variant === "loading" ? <span className="sr-only">Loading</span> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default StatePanel;

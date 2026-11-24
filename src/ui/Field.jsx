import { Children, cloneElement, isValidElement, useId } from "react";

/**
 * Labelled form control wrapper. It connects the label, hint and error text to
 * the control with aria-describedby and aria-invalid.
 */
function Field({ label, hint, error, required = false, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const control = Children.map(children, (child) =>
    isValidElement(child)
      ? cloneElement(child, {
          id,
          required: required || child.props.required,
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": describedBy || undefined,
        })
      : child,
  );

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-navy">
        {label}
        {required ? (
          <span className="ml-1 font-normal text-muted">(required)</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Field;

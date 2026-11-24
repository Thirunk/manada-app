import { useRef, useState } from "react";
import { BRAND_OPTIONS } from "../config/products";
import { SITE } from "../config/site";
import { validateEnquiry } from "../lib/validation";
import Field from "./Field";
import StatePanel from "./StatePanel";

const EMPTY = {
  name: "",
  company: "",
  phone: "",
  email: "",
  machine: "",
  message: "",
};

/**
 * Customer enquiry form. It validates input and shows errors in text, and it
 * focuses the error summary on failure. The backend that stores enquiries is
 * not connected yet (M4). When the form is valid the component says so
 * honestly rather than pretending the enquiry was sent. No data is stored or
 * transmitted.
 */
function EnquiryForm({ initialMachine = "", productName = "" }) {
  const [values, setValues] = useState({ ...EMPTY, machine: initialMachine });
  const [errors, setErrors] = useState({});
  const [outcome, setOutcome] = useState(null);
  const summaryRef = useRef(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setOutcome("invalid");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setOutcome("unavailable");
  };

  const errorList = Object.values(errors);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
      aria-label="Customer enquiry"
    >
      {productName ? (
        <p className="rounded-md bg-canvas p-4 text-sm text-body">
          Enquiring about: <strong className="text-navy">{productName}</strong>
        </p>
      ) : null}

      {outcome === "invalid" && errorList.length ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 p-4 focus:outline-none"
        >
          <p className="font-semibold text-navy">
            Please correct the following:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
            {errorList.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {outcome === "unavailable" ? (
        <StatePanel variant="error" title="Your enquiry was not sent">
          The online enquiry service is not connected yet. Please call{" "}
          <a href={SITE.phones[0].href} className="link-action">
            {SITE.phones[0].display}
          </a>{" "}
          or{" "}
          <a href={SITE.phones[1].href} className="link-action">
            {SITE.phones[1].display}
          </a>
          .
        </StatePanel>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Full name" required error={errors.name}>
          <input
            className="field-input"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={update("name")}
          />
        </Field>
        <Field label="Company (optional)">
          <input
            className="field-input"
            name="company"
            autoComplete="organization"
            value={values.company}
            onChange={update("company")}
          />
        </Field>
        <Field
          label="Phone number"
          hint="Required if you do not give an email address."
          error={errors.phone ?? errors.contact}
        >
          <input
            className="field-input"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={update("phone")}
          />
        </Field>
        <Field label="Email address" error={errors.email}>
          <input
            className="field-input"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={update("email")}
          />
        </Field>
        <Field label="Machine of interest (optional)">
          <select
            className="field-input"
            name="machine"
            value={values.machine}
            onChange={update("machine")}
          >
            <option value="">Not sure yet</option>
            {BRAND_OPTIONS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        label="What do you need?"
        hint="For example: a new machine, a service visit or training."
        required
        error={errors.message}
      >
        <textarea
          className="field-input min-h-32"
          name="message"
          rows={5}
          value={values.message}
          onChange={update("message")}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary">
          Send enquiry
        </button>
        <p className="text-sm text-muted">
          We use these details only to reply to your enquiry.
        </p>
      </div>
    </form>
  );
}

export default EnquiryForm;

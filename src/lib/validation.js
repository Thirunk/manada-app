const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/;

/**
 * Validates the customer enquiry form. Returns an object keyed by field name;
 * an empty object means the form is valid.
 */
export function validateEnquiry(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = "Enter your name.";
  }

  const phone = values.phone?.trim() ?? "";
  const email = values.email?.trim() ?? "";
  if (!phone && !email) {
    errors.contact =
      "Enter a phone number or an email address so we can reply.";
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid phone number, for example 9608134164.";
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address, for example name@example.com.";
  }

  if ((values.message?.trim().length ?? 0) < 10) {
    errors.message = "Describe what you need in at least 10 characters.";
  }

  return errors;
}

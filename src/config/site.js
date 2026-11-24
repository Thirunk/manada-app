/**
 * Centralized company information.
 *
 * Every value here is taken from existing owner content (the header bar,
 * footer, and the homepage banners). Do not add addresses, legal details,
 * prices or specifications here without owner confirmation.
 */
export const SITE = {
  name: "Manada Embroidery Machine Solution",
  shortName: "Manada",
  description:
    "Sales, services, repair and training for sewing and embroidery machines.",
  // Existing company website reference (footer and banners).
  websiteUrl: "https://manadaembroidery.com",
  websiteLabel: "manadaembroidery.com",
  // Canonical origin is intentionally null until the owner confirms the
  // production domain. When null, canonical link tags are not emitted.
  canonicalOrigin: null,
  phones: [
    {
      label: "Sales and services",
      display: "91-9608134164",
      href: "tel:+919608134164",
    },
    {
      label: "Additional contact",
      display: "8341386424",
      href: "tel:+918341386424",
    },
  ],
};

export const primaryPhone = SITE.phones[0];

export function getCopyrightYear(date = new Date()) {
  return date.getFullYear();
}

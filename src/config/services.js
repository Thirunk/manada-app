/**
 * Service pages. Only "repair-maintenance" uses wording from the owner's
 * content. Other services are marked pending so no unverified service terms
 * are published.
 */
export const SERVICE_PAGES = [
  {
    slug: "repair-maintenance",
    title: "Repair and maintenance",
    intro:
      "We offer repair, maintenance, and support services for a wide variety of embroidery machines, regardless of brand, model, or type, including single-head, multi-head, industrial, and computerized embroidery machines.",
    points: ["Repair", "Maintenance", "Support"],
    pending: false,
  },
  {
    slug: "installation",
    title: "Installation",
    intro:
      "Installation service details are being confirmed by Manada. Contact us to ask about installing a machine.",
    points: [],
    pending: true,
  },
  {
    slug: "spare-parts",
    title: "Spare parts",
    intro:
      "Spare parts availability is being confirmed by Manada. Contact us to ask about parts for your machine.",
    points: [],
    pending: true,
  },
  {
    slug: "amc",
    title: "Annual maintenance contract (AMC)",
    intro:
      "Annual maintenance contract terms will be published once Manada confirms them. Contact us to ask about AMC for your machine.",
    points: [],
    pending: true,
  },
];

export function getServiceBySlug(slug) {
  return SERVICE_PAGES.find((service) => service.slug === slug) ?? null;
}

/**
 * Product lines named in the existing owner content (homepage banners and
 * support section). Specifications, prices and images per product are NOT
 * defined here; they must be supplied and approved by the owner.
 */
export const PRODUCT_LINES = [
  {
    slug: "unik-gold",
    name: "Unik Gold",
    summary: "Embroidery machines sold and serviced by Manada.",
  },
  {
    slug: "brother",
    name: "Brother",
    summary: "Sewing and embroidery machines sold and serviced by Manada.",
  },
  {
    slug: "bernina",
    name: "Bernina",
    summary: "Sewing and embroidery machines sold and serviced by Manada.",
  },
  {
    slug: "usha",
    name: "Usha",
    summary: "Sewing and embroidery machines sold and serviced by Manada.",
  },
];

export function getProductBySlug(slug) {
  return PRODUCT_LINES.find((product) => product.slug === slug) ?? null;
}

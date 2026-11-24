/**
 * Product lines named in the owner's existing content (banners and support
 * text). No specifications, prices or model names are defined here.
 *
 * Category assignments are provisional until the owner confirms them.
 */
export const CATEGORY_EMBROIDERY = "Embroidery machines";
export const CATEGORY_EMBROIDERY_SEWING = "Embroidery and sewing machines";

export const PRODUCT_LINES = [
  {
    slug: "unik-gold",
    brand: "Unik Gold",
    name: "Unik Gold embroidery machines",
    category: CATEGORY_EMBROIDERY,
    summary:
      "Embroidery machines from the Unik Gold range, sold and serviced by Manada.",
    photoIds: ["unik-gold-head", "unik-gold-touchscreen"],
  },
  {
    slug: "brother",
    brand: "Brother",
    name: "Brother machines",
    category: CATEGORY_EMBROIDERY_SEWING,
    summary: "Brother machines that Manada sells and services.",
    photoIds: [],
  },
  {
    slug: "bernina",
    brand: "Bernina",
    name: "Bernina machines",
    category: CATEGORY_EMBROIDERY_SEWING,
    summary: "Bernina machines that Manada sells and services.",
    photoIds: [],
  },
  {
    slug: "usha",
    brand: "Usha",
    name: "Usha machines",
    category: CATEGORY_EMBROIDERY_SEWING,
    summary: "Usha machines that Manada sells and services.",
    photoIds: [],
  },
];

export const CATEGORY_OPTIONS = [
  CATEGORY_EMBROIDERY,
  CATEGORY_EMBROIDERY_SEWING,
];

export const BRAND_OPTIONS = PRODUCT_LINES.map((product) => product.brand);

export function getProductBySlug(slug) {
  return PRODUCT_LINES.find((product) => product.slug === slug) ?? null;
}

export function getBrandSlug(brand) {
  return PRODUCT_LINES.find((product) => product.brand === brand)?.slug ?? null;
}

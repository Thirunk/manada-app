/**
 * Pure filtering logic for the product catalogue. Kept free of React so it
 * can be unit tested.
 */
export function filterProducts(
  products,
  { query = "", category = "", brand = "" } = {},
) {
  const needle = query.trim().toLowerCase();

  return products.filter((product) => {
    if (category && product.category !== category) return false;
    if (brand && product.brand !== brand) return false;
    if (!needle) return true;

    const haystack = [
      product.name,
      product.brand,
      product.summary,
      product.category,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function hasActiveFilters({
  query = "",
  category = "",
  brand = "",
} = {}) {
  return Boolean(query.trim() || category || brand);
}

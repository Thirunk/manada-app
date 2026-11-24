import { Link, useSearchParams } from "react-router-dom";
import {
  BRAND_OPTIONS,
  CATEGORY_OPTIONS,
  PRODUCT_LINES,
} from "../config/products";
import { filterProducts, hasActiveFilters } from "../lib/catalogue";
import ProductCard from "../ui/ProductCard";
import StatePanel from "../ui/StatePanel";
import { usePageMeta } from "../hooks/usePageMeta";
import { MACHINE_PHOTOS } from "../config/gallery";

const TOGGLE =
  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors";
const TOGGLE_OFF = "border-slate-300 bg-white text-navy hover:border-navy";
const TOGGLE_ON = "border-navy bg-navy text-white";

function ListItem({ product }) {
  const photo = product.photoIds.length
    ? MACHINE_PHOTOS[product.photoIds[0]]
    : null;
  return (
    <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="aspect-[4/3] w-full flex-none overflow-hidden rounded bg-canvas sm:w-48">
        {photo ? (
          <img
            src={photo.thumb}
            alt={photo.alt}
            width="240"
            height="180"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-muted">
            Photo pending
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{product.brand}</p>
        <h2 className="mt-1 font-display text-lg font-bold text-navy">
          <Link
            to={`/products/${product.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-body">{product.summary}</p>
      </div>
      <div className="flex flex-wrap gap-4 sm:flex-col sm:items-end">
        <Link to={`/products/${product.slug}`} className="link-action">
          View details
        </Link>
        <Link
          to={`/contact?product=${product.slug}#enquiry`}
          className="btn-secondary px-4 py-2 text-xs"
        >
          Request quotation
        </Link>
      </div>
    </article>
  );
}

function Products() {
  usePageMeta({
    title: "Products",
    description:
      "Sewing and embroidery machines from Unik Gold, Brother, Bernina and Usha, sold and serviced by Manada.",
    path: "/products",
  });

  const [params, setParams] = useSearchParams();
  const filters = {
    query: params.get("q") ?? "",
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
  };
  const view = params.get("view") === "list" ? "list" : "grid";
  const results = filterProducts(PRODUCT_LINES, filters);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="eyebrow">Product catalogue</p>
      <h1 className="display-title mt-3">Machines we sell and service</h1>
      <p className="lead mt-5 max-w-3xl">
        Browse by brand or category. Specifications and prices are not published
        here; request a quotation for the machine you need.
      </p>

      <form
        role="search"
        aria-label="Filter machines"
        onSubmit={(event) => event.preventDefault()}
        className="card mt-10 space-y-6 p-6"
      >
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="catalogue-search"
              className="text-sm font-semibold text-navy"
            >
              Search machines
            </label>
            <input
              id="catalogue-search"
              type="search"
              value={filters.query}
              onChange={(event) => update({ q: event.target.value })}
              placeholder="Search by brand or machine type"
              className="field-input mt-1.5"
            />
          </div>
          <div>
            <label
              htmlFor="catalogue-brand"
              className="text-sm font-semibold text-navy"
            >
              Brand
            </label>
            <select
              id="catalogue-brand"
              value={filters.brand}
              onChange={(event) => update({ brand: event.target.value })}
              className="field-input mt-1.5 md:w-56"
            >
              <option value="">All brands</option>
              {BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Category"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              aria-pressed={!filters.category}
              onClick={() => update({ category: "" })}
              className={`${TOGGLE} ${!filters.category ? TOGGLE_ON : TOGGLE_OFF}`}
            >
              All categories
            </button>
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={filters.category === category}
                onClick={() => update({ category })}
                className={`${TOGGLE} ${filters.category === category ? TOGGLE_ON : TOGGLE_OFF}`}
              >
                {category}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Result layout"
          >
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => update({ view: "" })}
              className={`${TOGGLE} ${view === "grid" ? TOGGLE_ON : TOGGLE_OFF}`}
            >
              Grid
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => update({ view: "list" })}
              className={`${TOGGLE} ${view === "list" ? TOGGLE_ON : TOGGLE_OFF}`}
            >
              List
            </button>
          </div>
        </div>

        {hasActiveFilters(filters) ? (
          <div>
            <button
              type="button"
              onClick={() =>
                setParams(new URLSearchParams(), { replace: true })
              }
              className="link-action"
            >
              Clear all filters
            </button>
          </div>
        ) : null}
      </form>

      <p
        role="status"
        aria-live="polite"
        className="mt-8 text-sm font-semibold text-body"
      >
        Showing {results.length} of {PRODUCT_LINES.length} product lines
      </p>

      <div className="mt-6">
        {results.length === 0 ? (
          <StatePanel
            variant="empty"
            title="No machines match these filters"
            action={
              <button
                type="button"
                onClick={() =>
                  setParams(new URLSearchParams(), { replace: true })
                }
                className="btn-secondary"
              >
                Clear filters
              </button>
            }
          >
            Try a different brand or category, or contact Manada and we will
            help you find a machine.
          </StatePanel>
        ) : view === "list" ? (
          <ul className="space-y-4">
            {results.map((product) => (
              <li key={product.slug}>
                <ListItem product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Products;

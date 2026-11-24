import { Link } from "react-router-dom";
import { PRODUCT_LINES } from "../config/products";
import ContentPage from "../ui/ContentPage";

function Products() {
  return (
    <ContentPage
      title="Products"
      path="/products"
      intro="Sewing and embroidery machine brands that Manada sells and services."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {PRODUCT_LINES.map((product) => (
          <li key={product.slug}>
            <Link
              to={`/products/${product.slug}`}
              className="block h-full rounded-lg border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
            >
              <h2 className="text-xl font-semibold text-stone-900">
                {product.name}
              </h2>
              <p className="mt-2 text-stone-700">{product.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-stone-700">
        For the current range and product details, contact Manada.
      </p>
    </ContentPage>
  );
}

export default Products;

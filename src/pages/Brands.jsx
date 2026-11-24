import { Link } from "react-router-dom";
import { PRODUCT_LINES } from "../config/products";
import ContentPage from "../ui/ContentPage";
import { usePageMeta } from "../hooks/usePageMeta";

function Brands() {
  usePageMeta({
    title: "Brands",
    description:
      "Brands of sewing and embroidery machines that Manada sells and services.",
    path: "/brands",
  });

  return (
    <ContentPage
      title="Brands"
      eyebrow="Supported brands"
      intro="Manada sells and services machines from the brands below. Choose a brand to see the machines we list."
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {PRODUCT_LINES.map((product) => (
          <li key={product.slug}>
            <article className="card flex h-full flex-col gap-3 p-6">
              <h2 className="font-display text-2xl font-bold text-navy">
                {product.brand}
              </h2>
              <p className="text-sm text-body">{product.summary}</p>
              <div className="mt-auto flex flex-wrap gap-4 pt-3">
                <Link
                  to={`/products?brand=${encodeURIComponent(product.brand)}`}
                  className="link-action"
                >
                  View {product.brand} machines
                </Link>
                <Link
                  to={`/contact?product=${product.slug}#enquiry`}
                  className="link-action"
                >
                  Request quotation
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}

export default Brands;

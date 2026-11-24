import { Link, useLoaderData } from "react-router-dom";
import { MACHINE_PHOTOS } from "../config/gallery";
import { PRODUCT_LINES } from "../config/products";
import { usePageMeta } from "../hooks/usePageMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import ProductCard from "../ui/ProductCard";
import ProductGallery from "../ui/ProductGallery";
import StatePanel from "../ui/StatePanel";
import VideoPlayer from "../ui/VideoPlayer";

function ProductDetail() {
  const product = useLoaderData();
  const photos = product.photoIds.map((id) => MACHINE_PHOTOS[id]);
  const related = PRODUCT_LINES.filter(
    (item) => item.category === product.category && item.slug !== product.slug,
  );

  usePageMeta({
    title: product.name,
    description: product.summary,
    path: `/products/${product.slug}`,
  });
  useStructuredData(`product-${product.slug}`, {
    "@type": "Product",
    name: product.name,
    description: product.summary,
    category: product.category,
    brand: { "@type": "Brand", name: product.brand },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-body">
          <li>
            <Link to="/products" className="underline-offset-4 hover:underline">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-navy">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <ProductGallery photos={photos} productName={product.name} />

        <div>
          <p className="eyebrow">{product.brand}</p>
          <h1 className="display-title mt-3">{product.name}</h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-muted">
            {product.category}
          </p>
          <p className="lead mt-6">{product.summary}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to={`/contact?product=${product.slug}#enquiry`}
              className="btn-primary"
            >
              Request quotation
            </Link>
            <Link to="/products" className="btn-secondary">
              Back to all products
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted">
            Prices are not published on this website. Contact Manada for a
            quotation.
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="specs-heading">
          <h2
            id="specs-heading"
            className="font-display text-2xl font-bold text-navy"
          >
            Specifications
          </h2>
          <div className="mt-4">
            <StatePanel variant="info" title="Specifications not yet published">
              Specifications for {product.name} will be published once Manada
              confirms them. No specifications are shown until then.
            </StatePanel>
          </div>
        </section>

        <section aria-labelledby="brochure-heading">
          <h2
            id="brochure-heading"
            className="font-display text-2xl font-bold text-navy"
          >
            Brochure
          </h2>
          <div className="mt-4">
            <StatePanel variant="info" title="No brochure available yet">
              A brochure download will appear here once Manada approves a
              brochure file.
            </StatePanel>
          </div>
        </section>
      </div>

      <section aria-labelledby="video-heading" className="mt-16">
        <h2
          id="video-heading"
          className="font-display text-2xl font-bold text-navy"
        >
          Demonstration video
        </h2>
        <div className="mt-4 max-w-4xl">
          <VideoPlayer title={product.name} src={null} />
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2
            id="related-heading"
            className="font-display text-2xl font-bold text-navy"
          >
            Related machines
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default ProductDetail;

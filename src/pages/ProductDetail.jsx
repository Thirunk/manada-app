import { Link, useLoaderData } from "react-router-dom";
import ContentPage from "../ui/ContentPage";

function ProductDetail() {
  const product = useLoaderData();

  return (
    <ContentPage
      title={product.name}
      path={`/products/${product.slug}`}
      intro={product.summary}
    >
      <p className="text-stone-700">
        Specifications, images and pricing for {product.name} will be published
        once Manada has confirmed them. No specifications are shown until then.
      </p>
      <p>
        <Link
          to="/products"
          className="font-semibold text-stone-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          Back to all products
        </Link>
      </p>
    </ContentPage>
  );
}

export default ProductDetail;

import { getProductBySlug } from "../config/products";

/**
 * Validates the slug before rendering. An unknown slug throws a 404 response,
 * which the route's errorElement turns into a controlled "not found" message.
 */
export function productLoader({ params }) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }
  return product;
}

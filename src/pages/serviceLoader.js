import { getServiceBySlug } from "../config/services";

/** Validates the slug before rendering. Unknown slugs throw a 404 response. */
export function serviceLoader({ params }) {
  const service = getServiceBySlug(params.slug);
  if (!service) {
    throw new Response("Service not found", { status: 404 });
  }
  return service;
}

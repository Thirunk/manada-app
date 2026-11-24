import { Link } from "react-router-dom";
import { MACHINE_PHOTOS } from "../config/gallery";
import StatusBadge from "./StatusBadge";

/**
 * Catalogue card. It shows the owner's photo when one exists, or a clearly
 * labelled "photo pending" block when it does not. It never shows invented
 * imagery.
 */
function ProductCard({ product }) {
  const photo = product.photoIds.length
    ? MACHINE_PHOTOS[product.photoIds[0]]
    : null;

  return (
    <article className="card flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-raised">
      <div className="aspect-[4/3] overflow-hidden bg-canvas">
        {photo ? (
          <img
            src={photo.medium}
            srcSet={`${photo.medium} 640w, ${photo.src} ${photo.width}w`}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-muted">
            Photo pending
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{product.brand}</p>
          <StatusBadge
            status={product.photoIds.length ? "Active" : "Pending"}
          />
        </div>
        <h2 className="font-display text-xl font-bold text-navy">
          <Link
            to={`/products/${product.slug}`}
            className="rounded-sm underline-offset-4 hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <p className="text-sm leading-6 text-body">{product.summary}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {product.category}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
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
      </div>
    </article>
  );
}

export default ProductCard;

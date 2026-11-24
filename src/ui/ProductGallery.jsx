import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import StatePanel from "./StatePanel";

const ICON_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy/30 bg-white text-navy hover:bg-navy hover:text-white";

/**
 * Product image gallery: main image, thumbnails, zoom toggle and a fullscreen
 * viewer. Every control is a button with a text name. Photos come from props,
 * so the component can later receive data from the backend (M4).
 */
function ProductGallery({ photos, productName }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (!photos.length) {
    return (
      <StatePanel variant="info" title="Photos are not available yet">
        Photos of {productName} will be added once Manada supplies them.
      </StatePanel>
    );
  }

  const total = photos.length;
  const photo = photos[index];
  const show = (next) => setIndex((next + total) % total);

  return (
    <div className="space-y-4">
      <figure className="relative overflow-hidden rounded-lg bg-canvas">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden">
          <img
            key={photo.id}
            src={photo.medium}
            srcSet={`${photo.medium} 640w, ${photo.src} ${photo.width}w`}
            sizes="(min-width: 1024px) 560px, 100vw"
            alt={`${productName}: ${photo.alt}`}
            width={photo.width}
            height={photo.height}
            decoding="async"
            className={`h-full w-full object-contain transition-transform duration-300 motion-reduce:transition-none ${
              zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            }`}
          />
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed}
            className={ICON_BUTTON}
          >
            {zoomed ? (
              <MagnifyingGlassMinusIcon
                aria-hidden="true"
                className="h-5 w-5"
              />
            ) : (
              <MagnifyingGlassPlusIcon aria-hidden="true" className="h-5 w-5" />
            )}
            <span className="sr-only">{zoomed ? "Reset zoom" : "Zoom in"}</span>
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className={ICON_BUTTON}
          >
            <ArrowsPointingOutIcon aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">View full screen</span>
          </button>
        </div>
        {total > 1 ? (
          <figcaption className="sr-only">
            Image {index + 1} of {total}
          </figcaption>
        ) : null}
      </figure>

      {total > 1 ? (
        <ul
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
          aria-label={`${productName} thumbnails`}
        >
          {photos.map((item, itemIndex) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-current={itemIndex === index ? "true" : undefined}
                aria-label={`Show image ${itemIndex + 1} of ${total}`}
                className={`block w-full overflow-hidden rounded-md border-2 bg-canvas ${
                  itemIndex === index
                    ? "border-navy"
                    : "border-transparent hover:border-slate-400"
                }`}
              >
                <img
                  src={item.thumb}
                  alt=""
                  width="240"
                  height={Math.round((240 * item.height) / item.width)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog
        open={fullscreen}
        onClose={setFullscreen}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-navy/90" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="theme-dark relative w-full max-w-5xl">
            <div className="flex items-center justify-between pb-3 text-white">
              <p className="text-sm font-semibold">
                {productName}: image {index + 1} of {total}
              </p>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                <span className="sr-only">Close full screen view</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => show(index - 1)}
                aria-label="Previous image"
                className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-navy"
              >
                <ChevronLeftIcon aria-hidden="true" className="h-6 w-6" />
              </button>
              <img
                src={photo.src}
                alt={`${productName}: ${photo.alt}`}
                width={photo.width}
                height={photo.height}
                className="max-h-[75vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => show(index + 1)}
                aria-label="Next image"
                className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-navy"
              >
                <ChevronRightIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

export default ProductGallery;

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { MACHINE_SLIDES } from "../config/gallery";

const CONTROL_CLASS =
  "inline-flex h-12 w-12 flex-none items-center justify-center rounded-full border border-navy/30 bg-white text-navy transition-colors duration-200 hover:bg-navy hover:text-white";

/**
 * Homepage machine gallery. It shows the unique photographs only, wraps at
 * both ends, uses functional state updates, and announces the position through
 * a polite live region.
 */
function ImageSlider() {
  const [index, setIndex] = useState(0);
  const total = MACHINE_SLIDES.length;
  const slide = MACHINE_SLIDES[index];

  const showPrevious = () =>
    setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  return (
    <section aria-labelledby="machine-gallery-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Gallery</p>
          <h2
            id="machine-gallery-heading"
            className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl"
          >
            Machine gallery
          </h2>
        </div>
        <p aria-live="polite" className="text-sm font-semibold text-body">
          Image {index + 1} of {total}
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={showPrevious}
          aria-label="Previous machine image"
          className={CONTROL_CLASS}
        >
          <ChevronLeftIcon aria-hidden="true" className="h-6 w-6" />
        </button>
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-canvas">
          <img
            src={slide.medium}
            srcSet={`${slide.medium} 640w, ${slide.src} ${slide.width}w`}
            sizes="(min-width: 1024px) 720px, 90vw"
            alt={slide.alt}
            width={slide.width}
            height={slide.height}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={showNext}
          aria-label="Next machine image"
          className={CONTROL_CLASS}
        >
          <ChevronRightIcon aria-hidden="true" className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}

export default ImageSlider;

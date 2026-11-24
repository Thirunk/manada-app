import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { MACHINE_SLIDES } from "../config/gallery";

const CONTROL_CLASS =
  "inline-flex h-12 w-12 flex-none items-center justify-center rounded-full border-4 border-stone-500 bg-white text-stone-900 transition-colors hover:bg-yellow-100 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none";

/**
 * Machine image slider for the homepage. Wraps at both ends, uses functional
 * state updates, and exposes the current position through a polite live
 * region. Layout is flow-based, so it does not depend on viewport offsets.
 */
function ImageSlider() {
  const [index, setIndex] = useState(0);
  const total = MACHINE_SLIDES.length;
  const slide = MACHINE_SLIDES[index];

  const showPrevious = () =>
    setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  return (
    <section
      aria-labelledby="machine-gallery-heading"
      className="mx-auto mb-10 mt-6 max-w-5xl px-4"
    >
      <h2 id="machine-gallery-heading" className="sr-only">
        Machine gallery
      </h2>
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={showPrevious}
          aria-label="Previous machine image"
          className={CONTROL_CLASS}
        >
          <ChevronLeftIcon aria-hidden="true" className="h-6 w-6" />
        </button>

        <div className="aspect-[4/3] w-full max-w-md overflow-hidden rounded-md border-4 border-white bg-stone-200 shadow-xl">
          <img
            src={slide.src}
            alt={slide.alt}
            width={slide.width}
            height={slide.height}
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
      <p aria-live="polite" className="mt-3 text-center text-sm text-stone-700">
        Image {index + 1} of {total}
      </p>
    </section>
  );
}

export default ImageSlider;

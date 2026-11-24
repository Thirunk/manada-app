import { HOME_BANNERS } from "../config/gallery";
import { SITE } from "../config/site";
import { usePageMeta } from "../hooks/usePageMeta";
import ImageSlider from "../ui/ImageSlider";
import SupportCenter from "../ui/SupportCenter";

function Home() {
  usePageMeta({ description: SITE.description, path: "/" });

  return (
    <>
      <h1 className="sr-only">{SITE.name}</h1>
      <ImageSlider />
      <section
        aria-label="Promotional banners"
        className="mx-auto max-w-5xl space-y-6 px-4 pb-10"
      >
        {HOME_BANNERS.map((banner) => (
          <div
            key={banner.src}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <img
              src={banner.src}
              alt={banner.alt}
              width={banner.width}
              height={banner.height}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </div>
        ))}
      </section>
      <SupportCenter />
    </>
  );
}

export default Home;

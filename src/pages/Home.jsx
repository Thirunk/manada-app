import { Link } from "react-router-dom";
import { HOME_BANNERS } from "../config/gallery";
import { MACHINE_PHOTOS } from "../config/gallery";
import {
  BRAND_OPTIONS,
  CATEGORY_EMBROIDERY,
  CATEGORY_EMBROIDERY_SEWING,
  PRODUCT_LINES,
} from "../config/products";
import { SITE, primaryPhone } from "../config/site";
import { usePageMeta } from "../hooks/usePageMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import EnquiryForm from "../ui/EnquiryForm";
import ImageSlider from "../ui/ImageSlider";
import ProductCard from "../ui/ProductCard";
import VideoPlayer from "../ui/VideoPlayer";

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE.name,
  description: SITE.description,
  telephone: SITE.phones.map((phone) => phone.display),
};

const SERVICE_CARDS = [
  {
    title: "Sales",
    body: "All kinds of embroidery machines, including UNIK GOLD, BROTHER, BERNINA and USHA.",
    to: "/products",
    cta: "Browse machines",
  },
  {
    title: "Service",
    body: "Repair, maintenance and support for a wide variety of embroidery machines, regardless of brand, model or type.",
    to: "/services",
    cta: "See services",
  },
  {
    title: "Training",
    body: "Embroidery training and embroidery design training.",
    to: "/training",
    cta: "See training",
  },
];

const CATEGORY_TILES = [
  {
    label: CATEGORY_EMBROIDERY,
    to: `/products?category=${encodeURIComponent(CATEGORY_EMBROIDERY)}`,
  },
  {
    label: CATEGORY_EMBROIDERY_SEWING,
    to: `/products?category=${encodeURIComponent(CATEGORY_EMBROIDERY_SEWING)}`,
  },
];

function Home() {
  usePageMeta({ description: SITE.description, path: "/" });
  useStructuredData("organization", ORGANIZATION);

  const featured = PRODUCT_LINES.filter(
    (product) => product.photoIds.length > 0,
  );
  const heroPhoto = MACHINE_PHOTOS["unik-gold-head"];

  return (
    <>
      <h1 className="sr-only">{SITE.name}</h1>

      {/* Hero */}
      <section
        aria-label="Introduction"
        className="theme-dark bg-navy text-white"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <p className="eyebrow !text-gold">Sales · Service · Training</p>
            <p className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Embroidery and sewing machines, supported from sale to service.
            </p>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Manada sells and services all kinds of sewing and embroidery
              machines, with repair, maintenance and training for your team.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary">
                Browse machines
              </Link>
              <Link to="/contact#enquiry" className="btn-on-dark">
                Request a quotation
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-300">
              Call sales and service:{" "}
              <a
                href={primaryPhone.href}
                className="font-semibold text-white underline underline-offset-4"
              >
                {primaryPhone.display}
              </a>
            </p>
          </div>
          <div className="overflow-hidden rounded-lg shadow-raised">
            <img
              src={heroPhoto.medium}
              srcSet={`${heroPhoto.medium} 640w, ${heroPhoto.src} ${heroPhoto.width}w`}
              sizes="(min-width: 1024px) 560px, 100vw"
              alt={heroPhoto.alt}
              width={heroPhoto.width}
              height={heroPhoto.height}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Services at a glance */}
      <section aria-labelledby="services-heading" className="section">
        <p className="eyebrow">What we do</p>
        <h2
          id="services-heading"
          className="display-title mt-3 text-3xl sm:text-4xl"
        >
          Sales, service and training
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICE_CARDS.map((card) => (
            <article key={card.title} className="card flex flex-col gap-3 p-6">
              <h3 className="font-display text-xl font-bold text-navy">
                {card.title}
              </h3>
              <p className="text-sm leading-6 text-body">{card.body}</p>
              <Link to={card.to} className="link-action mt-auto pt-2">
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Featured machines */}
      <section aria-labelledby="featured-heading" className="bg-canvas">
        <div className="section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured</p>
              <h2
                id="featured-heading"
                className="display-title mt-3 text-3xl sm:text-4xl"
              >
                Featured embroidery machines
              </h2>
            </div>
            <Link to="/products" className="link-action">
              View the full catalogue
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories and brands */}
      <section aria-labelledby="categories-heading" className="section">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Machine categories</p>
            <h2
              id="categories-heading"
              className="display-title mt-3 text-3xl sm:text-4xl"
            >
              Choose a category
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {CATEGORY_TILES.map((tile) => (
                <li key={tile.label}>
                  <Link
                    to={tile.to}
                    className="card block h-full p-6 hover:shadow-raised"
                  >
                    <span className="font-display text-lg font-bold text-navy">
                      {tile.label}
                    </span>
                    <span className="mt-3 block text-sm text-teal underline underline-offset-4">
                      Browse {tile.label.toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Supported brands</p>
            <h2 className="display-title mt-3 text-3xl sm:text-4xl">
              Brands we sell and service
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {BRAND_OPTIONS.map((brand) => (
                <li key={brand}>
                  <Link
                    to={`/products?brand=${encodeURIComponent(brand)}`}
                    className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center font-display font-bold text-navy hover:border-navy"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Demonstration video */}
      <section aria-labelledby="demo-heading" className="bg-canvas">
        <div className="section">
          <p className="eyebrow">Demonstration</p>
          <h2
            id="demo-heading"
            className="display-title mt-3 text-3xl sm:text-4xl"
          >
            See a machine in action
          </h2>
          <div className="mt-10 max-w-4xl">
            <VideoPlayer title="Machine demonstration" src={null} />
          </div>
        </div>
      </section>

      {/* Installation and maintenance */}
      <section aria-labelledby="install-heading" className="section">
        <p className="eyebrow">Installation and maintenance</p>
        <h2
          id="install-heading"
          className="display-title mt-3 text-3xl sm:text-4xl"
        >
          Keeping machines running
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="card p-6">
            <h3 className="font-display text-xl font-bold text-navy">
              Repair and maintenance
            </h3>
            <p className="mt-3 text-sm leading-6 text-body">
              We offer repair, maintenance and support for embroidery machines
              regardless of brand, model or type.
            </p>
            <Link
              to="/services/repair-maintenance"
              className="link-action mt-5"
            >
              Repair and maintenance details
            </Link>
          </article>
          <article className="card p-6">
            <h3 className="font-display text-xl font-bold text-navy">
              Installation
            </h3>
            <p className="mt-3 text-sm leading-6 text-body">
              Installation details are being confirmed by Manada. Contact us to
              ask about installing your machine.
            </p>
            <Link to="/services/installation" className="link-action mt-5">
              Installation enquiries
            </Link>
          </article>
        </div>
      </section>

      {/* Company introduction */}
      <section aria-labelledby="about-heading" className="bg-canvas">
        <div className="section grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">About Manada</p>
            <h2
              id="about-heading"
              className="display-title mt-3 text-3xl sm:text-4xl"
            >
              {SITE.name}
            </h2>
            <p className="lead mt-5 max-w-3xl">
              Manada provides sales and services for all kinds of sewing
              machines and embroidery machines, and offers embroidery and
              embroidery design training.
            </p>
          </div>
          <Link to="/about" className="btn-secondary">
            About us
          </Link>
        </div>
      </section>

      {/* Machine gallery (unique photographs only) */}
      <section aria-label="Machine photographs" className="section">
        <ImageSlider />
      </section>

      {/* Promotional banners, unchanged owner artwork */}
      <section aria-labelledby="banners-heading" className="bg-canvas">
        <div className="section">
          <h2
            id="banners-heading"
            className="font-display text-2xl font-bold text-navy"
          >
            Promotional banners
          </h2>
          <ul className="mt-8 grid gap-6">
            {HOME_BANNERS.map((banner) => (
              <li
                key={banner.src}
                className="overflow-hidden rounded-lg bg-white shadow-card"
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
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Customer enquiry */}
      <section aria-labelledby="enquiry-heading" className="section">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Customer enquiry</p>
            <h2
              id="enquiry-heading"
              className="display-title mt-3 text-3xl sm:text-4xl"
            >
              Request a quotation
            </h2>
            <p className="lead mt-5">
              Tell us which machine you need, or what service you are looking
              for. You can also call us directly.
            </p>
            <p className="mt-6 text-sm text-body">
              Sales and service:{" "}
              <a href={SITE.phones[0].href} className="link-action">
                {SITE.phones[0].display}
              </a>
            </p>
          </div>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}

export default Home;

import { Link } from "react-router-dom";
import { BRAND_OPTIONS } from "../config/products";
import { SITE } from "../config/site";
import ContentPage from "../ui/ContentPage";

function About() {
  return (
    <ContentPage
      title="About Us"
      eyebrow="About Manada"
      path="/about"
      intro={`${SITE.name} provides sales and services for all kinds of sewing machines and embroidery machines.`}
    >
      <section
        aria-labelledby="what-heading"
        className="grid gap-6 md:grid-cols-3"
      >
        <div className="card p-6">
          <h2
            id="what-heading"
            className="font-display text-xl font-bold text-navy"
          >
            What we do
          </h2>
          <p className="mt-3 text-sm leading-6 text-body">
            Sales of embroidery machines, service and repair, maintenance and
            support, and embroidery and embroidery design training.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-navy">Brands</h2>
          <p className="mt-3 text-sm leading-6 text-body">
            {BRAND_OPTIONS.join(", ")}.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-navy">
            Get in touch
          </h2>
          <p className="mt-3 text-sm leading-6 text-body">
            Visit{" "}
            <a href={SITE.websiteUrl} className="link-action">
              {SITE.websiteLabel}
            </a>{" "}
            or{" "}
            <Link to="/contact" className="link-action">
              contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </ContentPage>
  );
}

export default About;

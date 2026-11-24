import { Link } from "react-router-dom";
import { SITE } from "../config/site";
import ContentPage from "../ui/ContentPage";

function About() {
  return (
    <ContentPage
      title="About Us"
      path="/about"
      intro={`${SITE.name} provides sales and services for all kinds of sewing machines and embroidery machines.`}
    >
      <p className="text-stone-800">
        We sell and service embroidery machines from brands including Unik Gold,
        Brother, Bernina and Usha, and we also offer embroidery and embroidery
        design training.
      </p>
      <p>
        Visit our website at{" "}
        <a
          href={SITE.websiteUrl}
          className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          {SITE.websiteLabel}
        </a>{" "}
        or{" "}
        <Link
          to="/contact"
          className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          contact us
        </Link>{" "}
        directly.
      </p>
    </ContentPage>
  );
}

export default About;

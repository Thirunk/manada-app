import { useSearchParams } from "react-router-dom";
import { getProductBySlug } from "../config/products";
import { SITE } from "../config/site";
import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";
import EnquiryForm from "../ui/EnquiryForm";

function Contact() {
  usePageMeta({
    title: "Contact Us",
    description:
      "Call Manada for sales and service, or send an enquiry for a quotation.",
    path: "/contact",
  });

  const [params] = useSearchParams();
  const product = getProductBySlug(params.get("product") ?? "");

  return (
    <ContentPage
      title="Contact Us"
      eyebrow="Contact"
      intro="For sales and services, call one of the numbers below, or send an enquiry."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="phone-heading" className="card p-6">
          <h2
            id="phone-heading"
            className="font-display text-xl font-bold text-navy"
          >
            Phone
          </h2>
          <ul className="mt-4 space-y-3">
            {SITE.phones.map((phone) => (
              <li key={phone.href} className="text-body">
                <span className="block text-sm text-muted">{phone.label}</span>
                <a href={phone.href} className="link-action text-base">
                  {phone.display}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="web-heading" className="card p-6">
          <h2
            id="web-heading"
            className="font-display text-xl font-bold text-navy"
          >
            Website
          </h2>
          <p className="mt-4">
            <a href={SITE.websiteUrl} className="link-action">
              {SITE.websiteLabel}
            </a>
          </p>
          <p className="mt-4 text-sm text-muted">
            The postal address will be published once Manada confirms it.
          </p>
        </section>
      </div>

      <section
        id="enquiry"
        aria-labelledby="enquiry-heading"
        className="card scroll-mt-24 p-6 sm:p-8"
      >
        <h2
          id="enquiry-heading"
          className="font-display text-2xl font-bold text-navy"
        >
          Send an enquiry
        </h2>
        <div className="mt-6">
          <EnquiryForm
            initialMachine={product?.brand ?? ""}
            productName={product ? product.name : ""}
          />
        </div>
      </section>
    </ContentPage>
  );
}

export default Contact;

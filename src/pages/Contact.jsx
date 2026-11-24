import { SITE } from "../config/site";
import ContentPage from "../ui/ContentPage";

const LINK_CLASS =
  "font-semibold underline underline-offset-4 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none";

function Contact() {
  return (
    <ContentPage
      title="Contact Us"
      path="/contact"
      intro="For sales and services, call one of the numbers below."
    >
      <section aria-labelledby="phone-heading">
        <h2 id="phone-heading" className="text-xl font-semibold text-stone-900">
          Phone
        </h2>
        <ul className="mt-3 space-y-2">
          {SITE.phones.map((phone) => (
            <li key={phone.href}>
              <span className="text-stone-700">{phone.label}: </span>
              <a href={phone.href} className={LINK_CLASS}>
                {phone.display}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="web-heading">
        <h2 id="web-heading" className="text-xl font-semibold text-stone-900">
          Website
        </h2>
        <p className="mt-3">
          <a href={SITE.websiteUrl} className={LINK_CLASS}>
            {SITE.websiteLabel}
          </a>
        </p>
      </section>
      <p className="text-sm text-stone-700">
        The postal address will be published once Manada has confirmed it.
      </p>
    </ContentPage>
  );
}

export default Contact;

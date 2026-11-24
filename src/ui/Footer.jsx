import { Link } from "react-router-dom";
import { footerNavigation } from "../config/navigation";
import { SITE, getCopyrightYear } from "../config/site";
import logo from "../assets/logo.jpg";

const LINK_CLASS = "rounded-sm underline-offset-4 hover:underline";

function Footer() {
  return (
    <footer className="theme-dark bg-navy text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt=""
              width="48"
              height="48"
              className="h-12 w-12 rounded bg-white object-contain p-0.5"
            />
            <p className="font-display text-lg font-bold text-white">
              {SITE.name}
            </p>
          </div>
          <p className="text-sm leading-6">{SITE.description}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Explore
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {footerNavigation.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={LINK_CLASS}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SITE.phones.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className={LINK_CLASS}>
                  {phone.display}
                </a>
              </li>
            ))}
            <li>
              <a href={SITE.websiteUrl} className={LINK_CLASS}>
                {SITE.websiteLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm sm:px-6 lg:px-8">
          © {getCopyrightYear()}{" "}
          <a href={SITE.websiteUrl} className={LINK_CLASS}>
            {SITE.name}
          </a>
          . All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;

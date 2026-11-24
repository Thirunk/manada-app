import { Link } from "react-router-dom";
import { SITE, primaryPhone } from "../config/site";
import Logo from "./Logo";
import Menu from "./Menu";

/**
 * Site header: a navy contact strip with the business numbers, then the
 * brand, navigation and the main enquiry action.
 */
function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="theme-dark bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-sm lg:px-8">
          <a
            href={primaryPhone.href}
            className="font-semibold underline-offset-4 hover:underline"
          >
            Reach us for Sales/Services @ {primaryPhone.display}
          </a>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {SITE.phones.slice(1).map((phone) => (
              <li key={phone.href}>
                <a
                  href={phone.href}
                  className="underline-offset-4 hover:underline"
                >
                  {phone.display}
                </a>
              </li>
            ))}
            <li>
              <a
                href={SITE.websiteUrl}
                className="underline-offset-4 hover:underline"
              >
                {SITE.websiteLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4">
          <Link
            to="/contact#enquiry"
            className="btn-primary hidden md:inline-flex"
          >
            Request a quotation
          </Link>
          <Menu />
        </div>
      </div>
    </header>
  );
}

export default Header;

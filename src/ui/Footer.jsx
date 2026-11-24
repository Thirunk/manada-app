import { Link } from "react-router-dom";
import { footerNavigation } from "../config/navigation";
import { SITE, getCopyrightYear } from "../config/site";

function Footer() {
  return (
    <footer className="bg-stone-800 px-4 py-6 text-stone-200 md:flex md:items-center md:justify-between md:px-6">
      <p className="text-sm">
        © {getCopyrightYear()}{" "}
        <a
          href={SITE.websiteUrl}
          className="rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          {SITE.name}
        </a>
        . All Rights Reserved.
      </p>
      <nav aria-label="Footer" className="mt-3 md:mt-0">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {footerNavigation.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}

export default Footer;

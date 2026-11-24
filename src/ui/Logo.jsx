import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { SITE } from "../config/site";

/**
 * Brand link to the homepage. The image is decorative because the visible
 * company name provides the accessible name for the link.
 */
function Logo() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3 rounded-md">
      <img
        src={logo}
        alt=""
        width="56"
        height="56"
        className="h-14 w-14 flex-none rounded-md object-contain"
      />
      <span className="text-base font-semibold leading-tight text-stone-900 sm:text-lg">
        {SITE.name}
      </span>
    </Link>
  );
}

export default Logo;

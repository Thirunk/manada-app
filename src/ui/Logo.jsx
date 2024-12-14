import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
function Logo() {
  return (
    <Link href="/" className="z-10 flex items-center gap-4">
      <img src={logo} className="h-14 w-24 rounded-md" alt="The Manada logo" />
      <span className="text-primary-100 text-xl font-semibold">
        Manada Embroidery Machine Solution
      </span>
    </Link>
  );
}

export default Logo;

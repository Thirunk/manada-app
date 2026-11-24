import { primaryPhone } from "../config/site";
import Logo from "./Logo";
import Menu from "./Menu";

function Header() {
  return (
    <header className="border-b border-gray-200 bg-yellow-500">
      <div className="bg-yellow-100 px-4 py-1 text-right text-sm font-bold text-stone-900">
        <a href={primaryPhone.href} className="rounded hover:underline">
          Reach us for Sales/Services @ {primaryPhone.display}
        </a>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 lg:px-8">
        <Logo />
        <Menu />
      </div>
    </header>
  );
}

export default Header;

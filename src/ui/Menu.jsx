import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { primaryNavigation } from "../config/navigation";
import { primaryPhone } from "../config/site";

const linkClass = ({ isActive }) =>
  [
    "rounded-md text-sm font-semibold leading-6 text-stone-900 underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none",
    isActive ? "underline decoration-2" : "",
  ].join(" ");

const mobileLinkClass = ({ isActive }) =>
  [
    "-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-100 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none",
    isActive ? "bg-yellow-100" : "",
  ].join(" ");

/**
 * Primary navigation. Desktop links and the mobile dialog both read the same
 * configuration in config/navigation.js. Headless UI's Dialog provides the
 * focus trap, Escape handling and focus restoration.
 */
function Menu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav aria-label="Primary" className="hidden lg:block">
        <ul className="flex gap-x-10">
          {primaryNavigation.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        aria-expanded={mobileMenuOpen}
        className="inline-flex items-center justify-center rounded-md p-2.5 text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/40 lg:hidden"
      >
        <span className="sr-only">Open main menu</span>
        <Bars3Icon aria-hidden="true" className="h-6 w-6" />
      </button>

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-stone-900/40" aria-hidden="true" />
        <DialogPanel className="fixed inset-y-0 right-0 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-stone-900">
              Site menu
            </DialogTitle>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-900/40"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-6">
            <ul className="divide-y divide-stone-200">
              {primaryNavigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={mobileLinkClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-6 text-sm text-stone-700">
            Sales and services:{" "}
            <a
              href={primaryPhone.href}
              className="rounded font-semibold text-stone-900 underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
            >
              {primaryPhone.display}
            </a>
          </p>
        </DialogPanel>
      </Dialog>
    </>
  );
}

export default Menu;

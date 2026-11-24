import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { primaryNavigation } from "../config/navigation";
import { primaryPhone } from "../config/site";

const desktopLinkClass = ({ isActive }) =>
  [
    "rounded-sm py-1 text-sm font-semibold text-navy underline-offset-8 hover:text-teal hover:underline",
    isActive ? "underline decoration-2" : "",
  ].join(" ");

const mobileLinkClass = ({ isActive }) =>
  [
    "-mx-3 block rounded-md px-3 py-3 text-base font-semibold text-navy hover:bg-canvas",
    isActive ? "bg-canvas" : "",
  ].join(" ");

/**
 * Primary navigation. Desktop links and the mobile dialog read the same
 * configuration. Headless UI's Dialog provides the focus trap, Escape
 * handling and focus restoration.
 */
function Menu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav aria-label="Primary" className="hidden xl:block">
        <ul className="flex gap-x-7">
          {primaryNavigation.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={desktopLinkClass}>
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
        className="inline-flex items-center justify-center rounded-md p-2.5 text-navy xl:hidden"
      >
        <span className="sr-only">Open main menu</span>
        <Bars3Icon aria-hidden="true" className="h-6 w-6" />
      </button>

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="relative z-50 xl:hidden"
      >
        <div className="fixed inset-0 bg-navy/50" aria-hidden="true" />
        <DialogPanel className="fixed inset-y-0 right-0 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg font-bold text-navy">
              Site menu
            </DialogTitle>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-navy"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-6">
            <ul className="divide-y divide-slate-200">
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
          <div className="mt-6 space-y-3">
            <NavLink
              to="/contact#enquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full"
            >
              Request a quotation
            </NavLink>
            <p className="text-sm text-body">
              Sales and services:{" "}
              <a href={primaryPhone.href} className="link-action">
                {primaryPhone.display}
              </a>
            </p>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}

export default Menu;

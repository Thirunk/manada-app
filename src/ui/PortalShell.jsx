import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import {
  BellIcon,
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getPortalRole } from "../config/portal";
import Logo from "./Logo";

const NOTIFICATIONS = [
  { id: 1, text: "Sample notification: a new enquiry was assigned." },
  { id: 2, text: "Sample notification: a service request needs review." },
  { id: 3, text: "Sample notification: a media file is awaiting approval." },
];

const navLinkClass = ({ isActive }) =>
  [
    "flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white",
    isActive ? "bg-white/15 text-white font-semibold" : "",
  ].join(" ");

function PortalNav({ roleId, onNavigate }) {
  const role = getPortalRole(roleId);
  return (
    <nav aria-label={`${role.label} portal navigation`}>
      <ul className="space-y-1">
        {role.sections.map((section) => {
          const to =
            section.id === "overview"
              ? `/preview/${roleId}`
              : `/preview/${roleId}/${section.id}`;
          return (
            <li key={section.id}>
              <NavLink
                to={to}
                end={section.id === "overview"}
                className={navLinkClass}
                onClick={onNavigate}
              >
                {section.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Responsive application shell for the design preview. It has a sidebar, a
 * header with breadcrumbs, notifications and profile controls, and a labelled
 * main landmark. The mobile sidebar is a Headless UI dialog. Notifications
 * and profile items are sample content only.
 */
function PortalShell({ roleId, breadcrumbs = [], children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = getPortalRole(roleId);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="theme-dark hidden w-64 flex-none flex-col bg-navy px-4 py-6 lg:flex">
        <Logo onDark />
        <div className="mt-8 flex-1 overflow-y-auto">
          <PortalNav roleId={roleId} />
        </div>
        <p className="mt-6 text-xs text-slate-300">
          {role.label} portal · sample navigation
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-warning">
          Design preview · Sample data · No sign-in · Not for public use
        </div>

        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-navy lg:hidden"
            >
              <Bars3Icon aria-hidden="true" className="h-6 w-6" />
              <span className="sr-only">Open portal navigation</span>
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-body">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.label} className="flex items-center gap-2">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {crumb.to && index < breadcrumbs.length - 1 ? (
                      <Link
                        to={crumb.to}
                        className="underline-offset-4 hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={
                          index === breadcrumbs.length - 1 ? "page" : undefined
                        }
                        className="font-semibold text-navy"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Popover className="relative">
              <PopoverButton className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-canvas">
                <BellIcon aria-hidden="true" className="h-6 w-6" />
                <span className="sr-only">
                  Notifications, {NOTIFICATIONS.length} sample items
                </span>
              </PopoverButton>
              <PopoverPanel className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-raised">
                <p className="font-semibold text-navy">Notifications</p>
                <ul className="mt-3 space-y-3 text-sm text-body">
                  {NOTIFICATIONS.map((item) => (
                    <li
                      key={item.id}
                      className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </PopoverPanel>
            </Popover>

            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-navy hover:bg-canvas">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  SA
                </span>
                <span className="hidden sm:inline">Sample user</span>
                <ChevronDownIcon aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Profile menu</span>
              </MenuButton>
              <MenuItems className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-raised focus:outline-none">
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={`/preview/${roleId}/profile`}
                      className={`block rounded-md px-3 py-2 text-sm text-navy ${focus ? "bg-canvas" : ""}`}
                    >
                      Profile
                    </Link>
                  )}
                </MenuItem>
                <MenuItem disabled>
                  {() => (
                    <span className="block cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted">
                      Sign out (available after M3)
                    </span>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-8 focus:outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>

      <Dialog
        open={drawerOpen}
        onClose={setDrawerOpen}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-navy/60" aria-hidden="true" />
        <DialogPanel className="theme-dark fixed inset-y-0 left-0 w-72 overflow-y-auto bg-navy px-4 py-6">
          <div className="flex items-center justify-between">
            <Logo onDark />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md p-2 text-white"
            >
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              <span className="sr-only">Close portal navigation</span>
            </button>
          </div>
          <div className="mt-8">
            <PortalNav
              roleId={roleId}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}

export default PortalShell;

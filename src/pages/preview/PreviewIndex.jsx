import { Link } from "react-router-dom";
import { PORTAL_ROLES } from "../../config/portal";
import { useNoIndex } from "../../hooks/useNoIndex";
import { usePageMeta } from "../../hooks/usePageMeta";
import Logo from "../../ui/Logo";

function PreviewIndex() {
  usePageMeta({
    title: "Design preview",
    description: "Local design preview of the role portals.",
    path: undefined,
  });
  useNoIndex();

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-warning">
        Design preview · Sample data · No sign-in · Not for public use
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-12 focus:outline-none sm:px-6"
      >
        <Logo />
        <h1 className="display-title mt-8">Portal design preview</h1>
        <p className="lead mt-4 max-w-3xl">
          These screens show the layout of each role portal with sample data.
          They are not authenticated and do not expose real customer, order or
          business information.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {Object.entries(PORTAL_ROLES).map(([roleId, role]) => (
            <li key={roleId}>
              <Link
                to={`/preview/${roleId}`}
                className="card block h-full p-6 hover:shadow-raised"
              >
                <span className="font-display text-xl font-bold text-navy">
                  {role.label} portal
                </span>
                <span className="mt-2 block text-sm text-body">
                  {role.sections.length} sections
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/preview/media"
              className="card block h-full p-6 hover:shadow-raised"
            >
              <span className="font-display text-xl font-bold text-navy">
                Media library
              </span>
              <span className="mt-2 block text-sm text-body">
                Upload, ordering, cover and approval layout
              </span>
            </Link>
          </li>
        </ul>
        <p className="mt-10 text-sm text-body">
          <Link to="/" className="link-action">
            Back to the public website
          </Link>
        </p>
      </main>
    </div>
  );
}

export default PreviewIndex;

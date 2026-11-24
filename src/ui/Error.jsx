import { useEffect } from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

const LINK_CLASS =
  "inline-flex rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none";

/**
 * Controlled error content. Shows only a user-facing message and a way back
 * to the homepage. Stack traces and raw error messages are never rendered;
 * details are logged to the developer console in development builds only.
 */
export function ErrorMessage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">
        {isNotFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="text-lg text-stone-700">
        {isNotFound
          ? "The page you asked for does not exist or has moved."
          : "We could not load this page. Please try again, or return to the homepage."}
      </p>
      <Link to="/" className={LINK_CLASS}>
        Return to the homepage
      </Link>
    </section>
  );
}

/** Used for errors inside the page layout. */
function RouteError() {
  return <ErrorMessage />;
}

/** Used when the application shell itself fails to render. */
export function RootError() {
  return (
    <main id="main-content" tabIndex={-1} className="focus:outline-none">
      <ErrorMessage />
    </main>
  );
}

export default RouteError;

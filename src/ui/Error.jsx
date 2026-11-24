import { useEffect } from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import StatePanel from "./StatePanel";

/**
 * Controlled error content. It shows only a user-facing message and a way back
 * to the homepage. Stack traces and raw error messages are never rendered. In
 * development builds the error is logged to the console.
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <StatePanel
        variant="error"
        titleAs="h1"
        title={isNotFound ? "Page not found" : "Something went wrong"}
        action={
          <Link to="/" className="btn-primary">
            Return to the homepage
          </Link>
        }
      >
        {isNotFound
          ? "The page you asked for does not exist or has moved."
          : "We could not load this page. Please try again, or return to the homepage."}
      </StatePanel>
    </div>
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

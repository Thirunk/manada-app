import { Link } from "react-router-dom";
import StatePanel from "../ui/StatePanel";

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-title mt-3">Page not found</h1>
      <div className="mt-8">
        <StatePanel
          variant="info"
          title="This page does not exist or has moved."
        >
          <p className="mt-2">Try one of these instead:</p>
          <p className="mt-4 flex flex-wrap gap-6">
            <Link to="/" className="link-action">
              Homepage
            </Link>
            <Link to="/products" className="link-action">
              Products
            </Link>
            <Link to="/contact" className="link-action">
              Contact us
            </Link>
          </p>
        </StatePanel>
      </div>
    </div>
  );
}

export default NotFound;

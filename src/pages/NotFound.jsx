import { Link } from "react-router-dom";
import ContentPage from "../ui/ContentPage";

function NotFound() {
  return (
    <ContentPage
      title="Page not found"
      intro="The page you asked for does not exist or has moved."
    >
      <p className="flex flex-wrap gap-6">
        <Link
          to="/"
          className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          Return to the homepage
        </Link>
        <Link
          to="/products"
          className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          View products
        </Link>
      </p>
    </ContentPage>
  );
}

export default NotFound;

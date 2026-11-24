import { Link } from "react-router-dom";
import ContentPage from "../ui/ContentPage";

function Services() {
  return (
    <ContentPage
      title="Services"
      path="/services"
      intro="We offer repair, maintenance, and support services for a wide variety of embroidery machines, regardless of brand, model, or type, including single-head, multi-head, industrial, and computerized embroidery machines."
    >
      <ul className="list-disc space-y-2 pl-6 text-stone-800">
        <li>Repair</li>
        <li>Maintenance</li>
        <li>Support</li>
      </ul>
      <p>
        To discuss a service request,{" "}
        <Link
          to="/contact"
          className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          contact Manada
        </Link>
        .
      </p>
    </ContentPage>
  );
}

export default Services;

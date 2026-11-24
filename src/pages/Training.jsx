import { Link } from "react-router-dom";
import ContentPage from "../ui/ContentPage";

function Training() {
  return (
    <ContentPage
      title="Training"
      path="/training"
      intro="We will provide Embroidery Training and Embroidery Design Training."
    >
      <ul className="list-disc space-y-2 pl-6 text-stone-800">
        <li>Embroidery training</li>
        <li>Embroidery design training</li>
      </ul>
      <p>
        For course details,{" "}
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

export default Training;

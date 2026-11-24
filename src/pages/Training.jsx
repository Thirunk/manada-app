import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";
import StatePanel from "../ui/StatePanel";

const COURSES = [
  {
    title: "Embroidery training",
    body: "Training in operating embroidery machines.",
  },
  {
    title: "Embroidery design training",
    body: "Training in embroidery design.",
  },
];

function Training() {
  usePageMeta({
    title: "Training",
    description:
      "Embroidery training and embroidery design training from Manada.",
    path: "/training",
  });

  return (
    <ContentPage
      title="Training"
      eyebrow="Training"
      intro="We will provide Embroidery Training and Embroidery Design Training."
    >
      <ul className="grid gap-6 md:grid-cols-2">
        {COURSES.map((course) => (
          <li key={course.title} className="card p-6">
            <h2 className="font-display text-xl font-bold text-navy">
              {course.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-body">{course.body}</p>
          </li>
        ))}
      </ul>
      <StatePanel variant="info" title="Schedules and course details">
        Course schedules are not published on this website. Contact Manada for
        details.
      </StatePanel>
      <Link to="/contact#enquiry" className="btn-primary">
        Ask about training
      </Link>
    </ContentPage>
  );
}

export default Training;

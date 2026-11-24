import { Link, useLoaderData } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";
import StatePanel from "../ui/StatePanel";

function ServiceDetail() {
  const service = useLoaderData();
  usePageMeta({
    title: service.title,
    description: service.intro,
    path: `/services/${service.slug}`,
  });

  return (
    <ContentPage title={service.title} eyebrow="Service" intro={service.intro}>
      {service.points.length > 0 ? (
        <ul className="list-disc space-y-2 pl-6 text-body">
          {service.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
      {service.pending ? (
        <StatePanel variant="info" title="Details pending">
          Manada is confirming the details of this service. This page will be
          updated once they are confirmed.
        </StatePanel>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/contact#enquiry" className="btn-primary">
          Contact us about this service
        </Link>
        <Link to="/services" className="link-action">
          All services
        </Link>
      </div>
    </ContentPage>
  );
}

export default ServiceDetail;

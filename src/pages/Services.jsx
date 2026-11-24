import { Link } from "react-router-dom";
import { SERVICE_PAGES } from "../config/services";
import ContentPage from "../ui/ContentPage";

function Services() {
  return (
    <ContentPage
      title="Services"
      eyebrow="Service"
      path="/services"
      intro="Repair, maintenance and support for embroidery machines. Choose a service to read more or to ask us about it."
    >
      <ul className="grid gap-6 md:grid-cols-2">
        {SERVICE_PAGES.map((service) => (
          <li key={service.slug}>
            <article className="card flex h-full flex-col gap-3 p-6">
              <h2 className="font-display text-xl font-bold text-navy">
                {service.title}
              </h2>
              <p className="text-sm leading-6 text-body">{service.intro}</p>
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                <Link to={`/services/${service.slug}`} className="link-action">
                  Read more
                </Link>
                {service.pending ? (
                  <span className="badge bg-amber-100 text-warning">
                    Details pending
                  </span>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <p className="font-semibold text-navy">Training is available too.</p>
        <Link to="/training" className="link-action">
          See training
        </Link>
      </div>
    </ContentPage>
  );
}

export default Services;

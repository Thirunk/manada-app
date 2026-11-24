import { usePageMeta } from "../hooks/usePageMeta";

/**
 * Shared layout for informational pages: an eyebrow, one h1, an optional
 * lead paragraph and body content. It also sets page-specific metadata.
 */
function ContentPage({
  title,
  eyebrow,
  description,
  path,
  intro,
  children,
  wide = false,
}) {
  usePageMeta({ title, description: description ?? intro, path });

  return (
    <div
      className={`mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8 ${wide ? "max-w-7xl" : "max-w-4xl"}`}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="display-title mt-3">{title}</h1>
      {intro ? <p className="lead mt-5 max-w-3xl">{intro}</p> : null}
      {children ? <div className="mt-10 space-y-8">{children}</div> : null}
    </div>
  );
}

export default ContentPage;

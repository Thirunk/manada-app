import { usePageMeta } from "../hooks/usePageMeta";

/**
 * Shared layout for informational pages: one h1, optional intro, and body
 * content. Also sets the page-specific title and description.
 */
function ContentPage({ title, description, path, intro, children }) {
  usePageMeta({ title, description: description ?? intro, path });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h1>
      {intro ? <p className="mt-4 text-lg text-stone-700">{intro}</p> : null}
      {children ? <div className="mt-8 space-y-6">{children}</div> : null}
    </div>
  );
}

export default ContentPage;

import { useEffect } from "react";
import { SITE } from "../config/site";

/**
 * Sets the document title, meta description and (when a canonical origin is
 * configured) the canonical link for the current page.
 */
export function usePageMeta({ title, description, path } = {}) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : SITE.name;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    if (SITE.canonicalOrigin && path) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", new URL(path, SITE.canonicalOrigin).href);
    }
  }, [title, description, path]);
}

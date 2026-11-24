import { useEffect } from "react";

/**
 * Adds a JSON-LD script to the document head while the component is mounted.
 * The JSON is set as text content, never as HTML.
 */
export function useStructuredData(id, data) {
  useEffect(() => {
    if (!data) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.structuredData = id;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    });
    document.head.appendChild(script);

    return () => script.remove();
  }, [id, data]);
}

/**
 * Resolve a file in /public against the configured Vite base path so that
 * asset URLs keep working if the site is ever served from a sub-path.
 */
export function publicAsset(fileName) {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${fileName.replace(/^\/+/, "")}`;
}

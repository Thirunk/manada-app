import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";

// Routes and pages are lazy-loaded, so async queries need more time.
configure({ asyncUtilTimeout: 5000 });

// Vitest globals are enabled in vite.config.js, so this hook is registered
// correctly for every test file and resets the DOM and head between tests.
afterEach(() => {
  cleanup();
  document.title = "";
  document.head
    .querySelectorAll(
      'meta[name="description"], link[rel="canonical"], meta[name="robots"], script[data-structured-data]',
    )
    .forEach((node) => node.remove());
});

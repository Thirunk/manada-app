import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

// Vitest globals are enabled in vite.config.js, so this hook is registered
// correctly for every test file and resets the DOM and head between tests.
afterEach(() => {
  cleanup();
  document.title = "";
  document.head
    .querySelectorAll('meta[name="description"], link[rel="canonical"]')
    .forEach((node) => node.remove());
});

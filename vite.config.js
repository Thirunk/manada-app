import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The design preview (role portals and media library) is compiled in only for
// development builds or when VITE_ENABLE_DESIGN_PREVIEW=true is set at build
// time. As a literal constant, it lets the bundler remove the preview code
// from default production builds.
const designPreview = process.env.VITE_ENABLE_DESIGN_PREVIEW === "true";

const bffProxy = {
  "/api": { target: "http://127.0.0.1:5080", changeOrigin: false },
  "/bff": { target: "http://127.0.0.1:5080", changeOrigin: false },
  "/signin-oidc": { target: "http://127.0.0.1:5080", changeOrigin: false },
  "/signout-callback-oidc": {
    target: "http://127.0.0.1:5080",
    changeOrigin: false,
  },
};

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    // Same-origin BFF: the browser talks only to the Vite origin, which forwards
    // API, session and OIDC callback paths to the backend. Tokens never reach the browser.
    proxy: bffProxy,
  },
  preview: {
    // The production artifact uses the same local BFF boundary as development.
    // This is local-only preview hosting; no routes or authentication checks change.
    proxy: bffProxy,
  },
  define: {
    // Dev server (command "serve") and tests always include the preview.
    __DESIGN_PREVIEW__: JSON.stringify(command === "serve" || designPreview),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    css: false,
    globals: true,
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The design preview (role portals and media library) is compiled in only for
// development builds or when VITE_ENABLE_DESIGN_PREVIEW=true is set at build
// time. As a literal constant, it lets the bundler remove the preview code
// from default production builds.
const designPreview = process.env.VITE_ENABLE_DESIGN_PREVIEW === "true";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
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

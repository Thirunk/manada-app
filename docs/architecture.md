# Architecture

## Overview

A single-page React application built with Vite. Pages are rendered by React
Router from one route table (`src/router.jsx`). The app has no backend, no
authentication, no client-side state library and no forms.

```
index.html
src/main.jsx  -> App.jsx -> RouterProvider (createAppRouter from router.jsx)
                              AppLayout (shell)
                                SkipLink, Header (Logo, Menu), <main> Outlet, Footer
                                Route pages (src/pages)
```

## Layers

| Layer             | Location                                                           | Responsibility                                                                                  |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Configuration     | `src/config/`                                                      | Business data, navigation, products, gallery. The only place to change facts shown on the site. |
| Routing           | `src/router.jsx`                                                   | Route table, legacy redirects, loaders, error elements.                                         |
| Shell             | `src/ui/AppLayout.jsx`, `Header.jsx`, `Footer.jsx`, `SkipLink.jsx` | Landmarks and layout only. No page content.                                                     |
| Navigation        | `src/ui/Menu.jsx`                                                  | Desktop links and the mobile dialog, both driven by `config/navigation.js`.                     |
| Pages             | `src/pages/`                                                       | One component per route. Informational pages use `ui/ContentPage.jsx`.                          |
| Components        | `src/ui/`                                                          | `ImageSlider`, `SupportCenter`, `Error`, `Logo`, `ContentPage`.                                 |
| Hooks and helpers | `src/hooks/`, `src/lib/`                                           | Page metadata and public asset URLs.                                                            |

## Key decisions

- **One route table.** `routes` is exported and used by both `createBrowserRouter`
  (in the app) and `createMemoryRouter` (in tests), so tests exercise the real routes.
- **Navigation is data.** Desktop and mobile navigation read the same array,
  so they cannot drift apart. A test asserts the two lists match.
- **Slider only on the homepage.** The slider lives in `pages/Home.jsx`, not in the shell.
- **Static header, no fixed positioning.** The header scrolls with the page, so it
  never covers focused content (WCAG 2.4.11 focus not obscured).
- **Dialog from Headless UI.** Focus trap, Escape handling and focus restoration
  come from the library and are covered by tests and browser checks.
- **Controlled errors.** `Error.jsx` shows a fixed message. Raw error objects and
  stacks are never rendered; details go to the console in development builds only.
- **Product detail is validated in a loader.** An unknown slug throws a 404
  response, which the route's error element shows as "Page not found".
- **No third-party runtime requests.** Images are local; the only outbound links
  are the company website and `tel:` links.
- **Dependencies stay minimal.** No state-management library. Tailwind 3.4 is kept
  because the brief asks not to change it without a technical need.

## Build and tooling

- Vite 8 builds `dist/`. `vite.config.js` also configures Vitest (jsdom, globals,
  `src/test/setup.js`).
- ESLint 9 flat config in `eslint.config.js`. ESLint is pinned to 9.x because
  `eslint-plugin-jsx-a11y` does not yet declare support for ESLint 10.
- Prettier formats code and sorts Tailwind classes. `.prettierignore` excludes
  generated and lock files.
- Playwright (`playwright.config.js`) builds the app and serves `dist/` with
  `vite preview` before running browser tests.

## Known limitations

- Route status codes are client-side: unknown URLs render "Page not found" with
  HTTP 200 unless the hosting layer returns 404 for unknown paths. Verify on hosting.
- `machine1`/`machine3` and `machine2`/`machine4` are byte-identical images, so
  the gallery shows duplicate photos. Left as provided; owner to confirm.
- `public/logo.jpg` is kept for reference but the site uses `src/assets/logo.jpg`.

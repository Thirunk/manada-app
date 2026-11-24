# Manada Embroidery Machine Solution

Public business website for Manada Embroidery Machine Solution: sales, services,
repair and training for sewing and embroidery machines.

M1 (foundation, security and modernization) is implemented. Corporate visual
design (M2) and any customer features are not part of this codebase yet.

## Technology stack

| Area                     | Version                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Runtime                  | Node.js 24 LTS (see `.nvmrc`)                                          |
| UI                       | React 19                                                               |
| Routing                  | React Router 7 (`react-router-dom`)                                    |
| Build                    | Vite 8 with `@vitejs/plugin-react` 6                                   |
| Styling                  | Tailwind CSS 3.4 (kept on 3.x by design)                               |
| Accessible dialogs       | Headless UI 2                                                          |
| Lint                     | ESLint 9 (flat config) with React, Hooks, Refresh and jsx-a11y plugins |
| Format                   | Prettier 3 with `prettier-plugin-tailwindcss`                          |
| Unit and component tests | Vitest 5, React Testing Library, user-event, jest-dom, jsdom           |
| Browser tests            | Playwright 1.65                                                        |
| Accessibility scans      | axe-core via `@axe-core/playwright`                                    |

The project is JavaScript (JSX). TypeScript migration is not part of M1.

## Requirements

- Node.js 24 (the version in `.nvmrc`; `package.json` `engines` enforces it).
- npm, which ships with Node.js.

## Local setup

```bash
nvm use            # or install Node.js 24 manually
npm ci             # reproducible install from package-lock.json
npm run test:browsers:install   # one-time: Playwright Chromium
npm run dev        # http://localhost:5173
```

Windows note: run commands from one consistently-cased path (for example
`D:\Projects\manada-app`). Mixing drive-letter casing between the shell and the
project path makes Vitest load duplicate modules and fail with
"Vitest failed to find the current suite".

## Commands

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `npm run dev`                  | Development server                                      |
| `npm run build`                | Production build into `dist/`                           |
| `npm run preview`              | Serve `dist/` on http://127.0.0.1:4173                  |
| `npm run lint`                 | ESLint, zero warnings allowed                           |
| `npm run format:check`         | Prettier check (`npm run format` to fix)                |
| `npm run test`                 | Vitest in watch mode                                    |
| `npm run test:ci`              | Vitest single run (unit and component tests)            |
| `npm run test:e2e`             | Playwright browser smoke tests on the production build  |
| `npm run test:a11y`            | Playwright plus axe-core accessibility checks (`@a11y`) |
| `npm audit --audit-level=high` | Fail on high or critical dependency advisories          |

## Project structure

```
src/
  config/        Centralized company info, navigation, products, gallery data
  hooks/         usePageMeta (title, description, optional canonical link)
  lib/           Helpers (public asset URLs)
  pages/         One component per route, plus the product loader
  test/          Vitest setup and render helpers
  ui/            Layout, header, menu, footer, slider, error and shared pieces
  router.jsx     Single route table used by the app and by tests
e2e/             Playwright smoke and accessibility specs
public/          Owner images (unchanged), favicons, robots.txt
docs/            Architecture, security, accessibility and M1 certification notes
```

## Routes

| Path                         | Page                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| `/`                          | Homepage: machine gallery, banners, support summary                 |
| `/products`                  | Product brands                                                      |
| `/products/:slug`            | Product detail scaffold (`unik-gold`, `brother`, `bernina`, `usha`) |
| `/services`                  | Services                                                            |
| `/training`                  | Training                                                            |
| `/about`                     | About us                                                            |
| `/contact`                   | Contact details                                                     |
| `/privacy-policy`            | Placeholder pending legal review                                    |
| `/terms`                     | Placeholder pending legal review                                    |
| `/product`, `/product/:slug` | Redirect to `/products` (legacy URLs)                               |
| anything else                | Controlled "Page not found"                                         |

## Accessibility and security

- Accessibility requirements and current evidence: [docs/accessibility-baseline.md](docs/accessibility-baseline.md).
- Security requirements and hosting headers that still must be verified:
  [docs/security-baseline.md](docs/security-baseline.md).

## Branch and release workflow

- `main` is the protected release branch. Do not push to it directly.
- `feature/manada-development` is the single M1 working branch.
- There is no automatic deployment. Deployment and DNS are owner decisions.
- Recommended branch protection and required checks are described in
  [docs/security-baseline.md](docs/security-baseline.md#github-protection).

## Current implementation scope (M1)

- Routing foundation, shared desktop and mobile navigation, skip link.
- Homepage with the owner's machine gallery and banners, unchanged images.
- Controlled error and not-found pages.
- Centralized company information (phones, website, copyright year).
- Accessibility and security foundation, automated test infrastructure.

## Deferred items

- Corporate visual design and layout refinement (M2).
- Postal address, privacy policy and terms text (need owner and legal approval).
- Product specifications, prices and product images (need owner data).
- Canonical domain, sitemap, Open Graph image, LocalBusiness structured data.
- Customer authentication (not approved; no login navigation is shown).
- Manual NVDA and full keyboard verification (pending, see the accessibility baseline).
- Production security headers (documented, not yet verified on hosting).

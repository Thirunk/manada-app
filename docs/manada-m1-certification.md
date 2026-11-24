# Manada M1 certification handoff

Written for: the independent certification agent (Codex) and the project owner.

This is an implementation handoff. It is **not** an independent certification.
Certification belongs to Codex, and merge and deployment belong to the owner.

## Baseline

- Repository: `Thirunk/manada-app`
- Baseline `main` SHA: `ebd976aa55a576b499847e481460ed1430886651`
- Working branch: `feature/manada-development` (created from the baseline; it did not exist before)
- Final commit SHA: recorded in the M1 completion report, after the last commit.

## What changed (summary)

- Toolchain: Node.js 24 (`.nvmrc`, `engines`), React 19, React Router 7, Vite 8, ESLint 9 flat config, Vitest 5, Playwright 1.65, axe-core. Tailwind kept on 3.4.
- Removed: unused FontAwesome packages, `vite-plugin-eslint`, `eslint-config-react-app`, `@types/*`, a stale `src/features` folder, `Navigation.jsx`, the default Vite favicon and React logo, and the demo GitHub workflows.
- Routing, navigation, shell, error and not-found handling, legacy `/product` redirects, controlled product validation.
- Accessibility: skip link, landmarks, page titles, slider rework, mobile dialog behaviour, reduced motion, focus styles.
- Security: removed external image hotlinks, hardened `.gitignore`, documented production headers, pattern-based secret scan.
- Tests: unit, component, browser and accessibility suites (see below).
- CI: `.github/workflows/ci.yml` with SHA-pinned actions and least-privilege permissions.
- Documentation: README and the four `docs/` files.

## Verification evidence (executed locally)

| Gate                       | Command                                   | Result                                   |
| -------------------------- | ----------------------------------------- | ---------------------------------------- |
| Dependency install         | `npm ci`                                  | Pass                                     |
| Dependency audit           | `npm audit --json`                        | 0 vulnerabilities at any severity        |
| Lint                       | `npm run lint`                            | Pass, 0 warnings                         |
| Formatting                 | `npm run format:check`                    | Pass                                     |
| Unit and component tests   | `npm run test:ci`                         | Pass, 47 of 47                           |
| Production build           | `npm run build`                           | Pass                                     |
| Browser tests              | `npm run test:e2e`                        | Pass, 24 of 24 (Chromium)                |
| Accessibility tests        | `npm run test:a11y`                       | Pass, 11 of 11 (axe, WCAG 2.2 A/AA tags) |
| Whitespace and patch check | `git diff --check`                        | See the completion report                |
| Secret scan                | pattern scan of tracked files and history | No matches (not a dedicated scanner)     |

Commands were run with Node.js 24.18.0 on Windows 11. The CI workflow has
not run yet because the branch has not been pushed.

## Items the certifier should check

1. Run `npm ci`, `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build`, `npm run test:e2e` and `npm run test:a11y` from a clean clone.
2. Confirm the CI workflow runs on a branch push and that all three jobs pass.
3. Review `package-lock.json` for the expected dependency set.
4. Confirm that no external network requests are made (`e2e/smoke.spec.js`).
5. Spot-check the homepage slider, banners and footer against the owner's content.

## Open items and blockers

- **NVDA and manual keyboard testing:** pending. Not performed.
- **Real 200% and 400% zoom:** pending. The 320 px reflow test is a proxy.
- **Owner content:** postal address, privacy policy and terms text, product specifications and prices, canonical domain, sitemap, Open Graph image and LocalBusiness data are all deferred until the owner supplies them.
- **Duplicate gallery images:** `machine1`/`machine3` and `machine2`/`machine4` are identical. Preserved as provided.
- **Production headers:** documented in `docs/security-baseline.md`; not verified on hosting.
- **GitHub branch protection:** recommended, not applied.
- **Node.js 26:** the current Active LTS line. This milestone pins Node.js 24, which is LTS and was used for verification here. Upgrading to 26 is a follow-up that needs a test run on 26.

## Status flags

- MAIN_MERGED: NO
- PRODUCTION_DEPLOYED: NO
- DEPLOYMENT_AUTHORIZED: NO
- Certification by Codex: pending

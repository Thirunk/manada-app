# Manada M2 certification handoff

Written for: the independent certification agent (Codex) and the project owner.

This is an implementation handoff. It is **not** an independent certification.
Certification belongs to Codex. Merge and deployment belong to the owner.

## Baseline and commits

- M1 certified baseline: `452699b56d09ab43adc5f66b02325f35110a7482`
- Working branch: `feature/manada-development` (no new branch created)
- M2 implementation commit: `1e947e1a9b3b96d78c882aa11052861d1c02d10a`
- Final commit: recorded in the M2 completion report after the last commit.

## Owner design approval

- **Owner design approval: APPROVED** for all 14 M2 visual design areas.
- The design direction is frozen. Further visual changes are limited to
  confirmed accessibility, security or functional defects.
- Frozen design system: `docs/design-system.md` (palette, typography, components,
  contrast table).

Approved areas:

1. Corporate public website and brand identity.
2. Colour palette: Navy #0B1728, Gold #D4A72C, White, Background #F5F7FA,
   Body #334155, Teal #0F766E.
3. Typography: Georgia serif headings, system sans-serif body (no web fonts).
4. Header and navigation (contact strip, desktop navigation, mobile dialog).
5. Product catalogue (search, category and brand filters, grid and list).
6. Product details and media galleries (thumbnails, fullscreen, zoom).
7. Services and training pages.
8. Login and registration screens.
9. SuperAdmin portal design.
10. Admin portal design.
11. Staff portal design.
12. Customer portal design.
13. Media management interface.
14. Mobile website experience.

## Screenshots

Location: `docs/design-review/` (captured from the local development preview).

| File                               | Shows                                          |
| ---------------------------------- | ---------------------------------------------- |
| `desktop-homepage.png`             | Homepage, full page, 1440 px                   |
| `mobile-homepage.png`              | Homepage, full page, 390 px                    |
| `desktop-catalogue.png`            | Product catalogue                              |
| `desktop-product-details.png`      | Product details with media gallery             |
| `desktop-services.png`             | Services                                       |
| `desktop-training.png`             | Training                                       |
| `desktop-login.png`                | Login                                          |
| `preview-superadmin-dashboard.png` | SuperAdmin portal (sample data)                |
| `preview-admin-dashboard.png`      | Admin portal (sample data)                     |
| `preview-staff-dashboard.png`      | Staff portal (sample data)                     |
| `preview-customer-dashboard.png`   | Customer portal (sample data)                  |
| `preview-media-manager.png`        | Media management interface (no uploads stored) |

## Verification

### Reused evidence (unchanged areas)

- 97 unit and component tests passed (includes 17 WCAG contrast checks).
- 34 browser smoke tests passed (Chromium, production build).
- 16 automated accessibility checks passed (axe-core, WCAG 2.2 A/AA tags).
- Production build, lint, formatting and high/critical dependency audit passed.

### Targeted verification of the final CSS change

The final change set fixed the form input focus indicator and the input
border colour. These checks were run against the production build:

- **Input border contrast:** the field border `#64748B` measures 4.76:1 against
  white (WCAG 1.4.11 requires 3:1). Checked on `/contact#enquiry`, `/login` and
  `/register`, at desktop (1440 px) and mobile (390 px) widths.
- **Focus visibility:** a defect was found and fixed. Tailwind's `focus:outline-none`
  had removed the input outline, leaving only a 30% teal ring. Inputs now use a
  3 px solid teal outline (5.47:1 against white). The spec checks that the outline
  is opaque and at least 3:1.
- **Target size:** each input is at least 24 px tall (WCAG 2.5.8).
- **Overflow:** no horizontal overflow on the enquiry form at either width.
- **Targeted browser tests:** `e2e/forms.spec.js`, 8 of 8 passed.
- **Targeted accessibility:** the axe suite was re-run after the change (see the M2
  completion report for the result).

## Production isolation

- Design-only role portals and the media library are excluded from the default
  production bundle. Verified: no preview chunks and no preview strings in `dist/`.
  They are included only in development builds or when
  `VITE_ENABLE_DESIGN_PREVIEW=true` is set at build time.
- Portal records are generated sample rows, labelled "Sample data". Dashboard
  figures are shown as a dash, not as numbers.
- Authentication screens do not send, check or store credentials. Each submit
  states that authentication is not connected (M3).
- The enquiry form validates input. When valid, it states that the enquiry was
  **not sent**. No delivery is reported.
- Media uploads are listed on the page as "Not uploaded". Nothing is stored.
- Privacy policy and terms are labelled as draft placeholders, not approved legal text.
- No production domain is hardcoded. `SITE.canonicalOrigin` is `null` until the
  owner confirms the domain. The existing website reference (`manadaembroidery.com`)
  is taken from the owner's content and is unchanged.

## Deferred requirements (not completed functionality)

- NVDA manual screen-reader verification: **pending**.
- Actual browser zoom at 200% and 400%: **pending**. The 320 px and 640 px
  reflow tests are proxies only.
- Real authentication (Keycloak) and backend authorization: M3.
- Database integration and functional role-based dashboards: M4.
- Enquiry delivery: M4.
- Image and video uploads, storage and publication: M4.
- Owner-approved privacy policy and terms text.
- Verified product specifications and prices.
- Business postal address.
- Canonical production domain, sitemap, Open Graph image.
- Production security headers (documented in `docs/security-baseline.md`, not verified on hosting).

## Items for the certifier to check

1. Run the commands in the M2 completion report from a clean clone.
2. Confirm the input focus outline and border contrast on a real browser.
3. Confirm that `dist/` contains no design-preview code.
4. Review the screenshots against the owner-approved design.
5. Confirm that no status message claims enquiry delivery, upload storage or sign-in.

## Status flags

- MAIN_MERGED: NO
- PRODUCTION_DEPLOYED: NO
- CI_RESTORED: NO
- PR_CREATED: NO
- Certification by Codex: pending

# Design system (M2)

Status: **APPROVED by the owner and frozen.** Further visual changes are limited to confirmed accessibility, security or functional defects. See `docs/manada-m2-certification.md`.

Source of truth: `src/design/tokens.js`. Tailwind reads the same values in
`tailwind.config.js`. The contrast test in `src/design/contrast.test.js`
checks every colour pair listed in `CONTRAST_PAIRS`.

## Colour

| Token                            | Value                       | Use                                              |
| -------------------------------- | --------------------------- | ------------------------------------------------ |
| `navy`                           | #0B1728                     | Headings, primary text, dark surfaces, footer    |
| `gold`                           | #D4A72C                     | Primary button fill and accents on navy only     |
| `gold-hover`                     | #B98D1E                     | Primary button hover                             |
| `teal`                           | #0F766E                     | Eyebrows, links, focus ring on light surfaces    |
| `body`                           | #334155                     | Body text                                        |
| `muted`                          | #475569                     | Secondary text, hints                            |
| `field`                          | #64748B                     | Form field borders (3:1 boundary requirement)    |
| `canvas`                         | #F5F7FA                     | Alternating section backgrounds                  |
| `white`                          | #FFFFFF                     | Cards and page background                        |
| `danger` / `warning` / `success` | #B91C1C / #92400E / #166534 | Status text and states, always with a text label |

### Contrast (WCAG 2.2 AA), verified by the unit test suite

| Pair                            | Ratio   | Minimum                | Result                        |
| ------------------------------- | ------- | ---------------------- | ----------------------------- |
| Body text on white              | 10.35:1 | 4.5:1                  | Pass                          |
| Body text on canvas             | 9.65:1  | 4.5:1                  | Pass                          |
| Muted text on white             | 7.58:1  | 4.5:1                  | Pass                          |
| Navy heading on white           | 17.99:1 | 4.5:1                  | Pass                          |
| Teal link on white              | 5.47:1  | 4.5:1                  | Pass                          |
| White text on navy              | 17.99:1 | 4.5:1                  | Pass                          |
| Gold text on navy               | 8.02:1  | 4.5:1                  | Pass                          |
| Navy text on gold button        | 8.02:1  | 4.5:1                  | Pass                          |
| Navy text on gold hover         | 5.90:1  | 4.5:1                  | Pass                          |
| Danger text on white            | 6.47:1  | 4.5:1                  | Pass                          |
| Success text on white           | 7.13:1  | 4.5:1                  | Pass                          |
| Warning text on white           | 7.09:1  | 4.5:1                  | Pass                          |
| Teal focus ring on white        | 5.47:1  | 3:1                    | Pass                          |
| Gold focus ring on navy         | 8.02:1  | 3:1                    | Pass                          |
| Form field boundary on white    | 4.76:1  | 3:1                    | Pass                          |
| Decorative card border on white | 1.48:1  | none (decorative only) | Not used to identify controls |

Gold is never used for text on white. Its contrast there is below 3:1, and the
test suite records that limit. The lighter card border (1.48:1) is decorative
only. Form fields and buttons use borders or fills that meet 3:1.

## Typography

- Headings: Georgia, Cambria, Times New Roman (serif, editorial hierarchy).
- Body and UI: system sans-serif stack.
- No web fonts are loaded, which avoids external requests. A self-hosted font
  can be added later with owner approval.

## Spacing, shape and shadow

- Sections use `.section`: `max-w-7xl`, horizontal padding 16/24/32 px, vertical
  padding 56 px (mobile) to 80 px (desktop).
- Corner radius: 6 px for controls, 8 px for cards. No oversized rounded cards.
- Shadows: `card` (subtle) and `raised` (menus and hover). No decorative glows.

## Breakpoints

Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280 px. The desktop
navigation appears at `xl`. Below `xl`, the menu uses the mobile dialog.

## Components

| Component                      | Notes                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Buttons                        | `btn-primary` (gold), `btn-secondary` (outline), `btn-on-dark`                                 |
| Forms                          | `Field` connects label, hint and error to the control. Errors are text.                        |
| Navigation                     | One route list drives desktop, mobile and footer navigation. Current page uses `aria-current`. |
| Data tables                    | Caption, column and row header scopes, horizontal scrolling on small screens                   |
| Cards                          | `card` class. Product, service and portal tiles                                                |
| Dialogs                        | Headless UI. Focus trap, Escape and focus restoration                                          |
| Notifications                  | `StatePanel` (`role="alert"` for errors, `role="status"` otherwise)                            |
| Status                         | `StatusBadge` always includes a text label                                                     |
| Loading, empty, error, success | `StatePanel` variants, used across catalogue, forms and portals                                |

## Focus

Focus uses a 3 px outline with a 3 px offset. On light surfaces it is teal. On
navy surfaces (`.theme-dark`) it is gold.

## Motion

Transitions are short (150–300 ms) and limited to colour, shadow and hover
states. `prefers-reduced-motion` removes transitions and smooth scrolling. No
autoplaying content exists.

## Decisions awaiting owner approval

1. The palette above, including navy as the primary dark surface and gold as the accent.
2. Serif headings with a system sans-serif body (no web fonts).
3. The gallery shows the two unique photographs only.
4. Product category labels ("Embroidery machines", "Embroidery and sewing
   machines") are provisional.

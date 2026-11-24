# Accessibility baseline

Target: WCAG 2.2 Level AA.

Automated checks are not full WCAG conformance. They detect a subset of
issues. Keyboard and screen-reader testing is still required, and this
document records which parts are still pending.

## Implemented

| Area                   | Implementation                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmarks              | `header` (banner), `main#main-content`, `footer` (contentinfo), labelled navs "Primary", "Mobile" and "Footer".                                      |
| Skip link              | First focusable element; visible on focus; moves focus to `#main-content` (verified in browser).                                                     |
| Headings               | One `h1` per page. Homepage has a visually hidden `h1` because banners are images. Sections use `h2`, cards use `h3`.                                |
| Page titles            | Each route sets `document.title` to "Page                                                                                                            | Manada Embroidery Machine Solution" and sets a meta description. |
| Navigation state       | `NavLink` sets `aria-current="page"` on the active page (unit and browser tested).                                                                   |
| Mobile menu            | Headless UI dialog with a labelled title; focus is trapped; Escape closes it; focus returns to the opening button; the menu closes after navigation. |
| Icon-only buttons      | Named with `sr-only` text or `aria-label` (checked: every button has an accessible name). Icons are `aria-hidden`.                                   |
| Image alternative text | Verified against image content: gallery slides and banners describe what is shown. The logo is decorative because the visible name is adjacent.      |
| Slider                 | Previous and Next buttons are labelled; wraps at both ends; current position is announced through a polite live region ("Image 2 of 4").             |
| Focus visibility       | Global `:focus-visible` outline plus ring styles on links and buttons.                                                                               |
| Focus not obscured     | The header is not fixed or sticky, so it never covers focused content.                                                                               |
| Reflow                 | No horizontal scrolling at 320 CSS px on all public routes (browser test). This is a reflow proxy for 400% zoom.                                     |
| Reduced motion         | `prefers-reduced-motion: reduce` removes transitions and smooth scrolling. No auto-playing content exists.                                           |
| Colour                 | Text colours are Tailwind stone and gray on white or stone backgrounds. The yellow header uses dark stone text.                                      |

## Automated verification (executed in M1)

| Check                                                                     | Tool                     | Result                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint including jsx-a11y recommended rules                               | `npm run lint`           | Pass, 0 warnings                                                                                                                            |
| Component and interaction tests                                           | Vitest + Testing Library | 47 of 47 pass                                                                                                                               |
| Browser behaviour (keyboard, menu, slider, reflow, images)                | Playwright, Chromium     | 24 of 24 pass                                                                                                                               |
| axe-core, WCAG 2.0/2.1/2.2 A and AA tags, 10 routes plus open mobile menu | `@axe-core/playwright`   | 11 of 11 pass (serious and critical gate). A separate full-impact probe on the 10 routes at desktop width found 0 violations at any impact. |

Scope limits:

- axe ran in Chromium only. The 10-route scan was at desktop width; the open
  mobile menu was gated on serious and critical impacts only.
- axe does not test focus order, meaning, or reading order. Those were covered by the browser tests above, not by axe.
- Colour contrast relies on axe's computed results; no separate contrast tool was run.

## Pending manual verification

These require a person and cannot be claimed as passing.

| Check                                                      | Status                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| NVDA on Windows: menu, slider, skip link and page headings | **Pending.** Not performed in this environment.    |
| Keyboard-only walk-through of every page                   | **Pending.** Automated tests cover key paths only. |
| 200% browser zoom on a real browser                        | **Pending.** The 320 px reflow test is a proxy.    |
| 400% browser zoom on a real browser                        | **Pending.** The 320 px reflow test is a proxy.    |
| Real-device mobile touch testing                           | **Pending.**                                       |

## Known accessibility-relevant content issues (owner)

- Gallery slides 1 and 3, and 2 and 4, are identical photos. Confirm whether duplicates are intended.
- Banner images contain text that is not repeated as page text. Their alt text
  summarises the text, but the owner may later want the phone numbers and address in HTML.

# Security baseline

Status key: **Implemented** = in this repository and verified by tests or tooling.
**Required** = must be configured on the production host and verified there.
Nothing in the "Required" table is active yet; this document does not claim
those controls are live.

## Implemented in the repository

| Control                         | How                                                                                                                                                                                                                                                | Evidence                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| No unsafe HTML rendering        | No `dangerouslySetInnerHTML` anywhere in `src/`.                                                                                                                                                                                                   | `git grep dangerouslySetInnerHTML` returns nothing. |
| No credentials in the frontend  | No secrets, tokens or environment variables are read by the app. No `.env.example` is needed.                                                                                                                                                      | Code review of `src/`.                              |
| No third-party runtime requests | Unsplash and Tailwind UI hotlinks removed. Icons come from npm packages.                                                                                                                                                                           | Browser test "loads no third-party resources".      |
| Controlled error output         | `ui/Error.jsx` shows fixed messages only.                                                                                                                                                                                                          | Unit test: raw error text is not rendered.          |
| Dependency audit                | `npm audit` reports 0 vulnerabilities at all severities at the time of M1 implementation. Run `npm audit --audit-level=high` before release.                                                                                                       | `npm audit --json` run locally.                     |
| Reproducible installs           | `npm ci` with the committed `package-lock.json`.                                                                                                                                                                                                   | Use `npm ci` in any build or deploy process.        |
| Ignored sensitive files         | `.gitignore` excludes `.env*`, keys, certificates, credential-like JSON, `.npmrc`, build output, test artifacts and temporary files.                                                                                                               | `.gitignore`.                                       |
| Secret scan (pattern-based)     | Searched tracked files and full git history for common credential patterns (AWS keys, private key blocks, GitHub, Slack, Google API and Stripe live keys, and password/token assignments). No matches. No `.env` or key files were ever committed. | Local `git grep` and `git log -G` run during M1.    |

Limitations of the secret scan: it used pattern matching, not a dedicated
scanner (gitleaks/trufflehog were not installed). Run a dedicated scanner
before any release.

## Required on the production host (not yet verified)

| Control                 | Recommended value                                                                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTPS                   | Serve everything over HTTPS; redirect HTTP to HTTPS.                                                                                                                                                                                                             |
| HSTS                    | `Strict-Transport-Security: max-age=31536000; includeSubDomains` (add `preload` only after the owner decides).                                                                                                                                                   |
| Content Security Policy | `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Tailwind and React output needs no inline scripts. Verify in the browser console after deploy. |
| X-Content-Type-Options  | `nosniff`                                                                                                                                                                                                                                                        |
| Referrer-Policy         | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                |
| Permissions-Policy      | `camera=(), microphone=(), geolocation=(), payment=(), usb=()`                                                                                                                                                                                                   |
| Clickjacking            | `frame-ancestors 'none'` in CSP, or `X-Frame-Options: DENY` for older browsers.                                                                                                                                                                                  |
| Caching                 | Hashed files in `dist/assets/` may use `Cache-Control: public, max-age=31536000, immutable`. `index.html` and `robots.txt` should use `no-cache`.                                                                                                                |

Do not mark any row above as active until a header scan of the deployed site
confirms it.

## GitHub protection (recommended, not changed)

The repository's protection settings were not modified; that needs owner approval.

Recommended for `main`:

- Require a pull request before merging; require at least one approval.
- Require status checks to pass: `Lint, format, unit tests and build`,
  `Browser smoke and accessibility checks`, and `Dependency security audit`.
- Require branches to be up to date before merging.
- Block force pushes and deletions.
- Restrict who can push to `main`.
- Enable secret scanning and push protection in repository security settings.
- Enable Dependabot alerts for npm and GitHub Actions.

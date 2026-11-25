# Manada M3 — Local Certification

Status: **local verification complete for the owner-approved M3 scope. Not pushed. Not merged. Not deployed.**

Branch: `feature/manada-development`
Baseline before this pass: `d6ea3134cd1ab31feef5a15448695551e306fe2d`
MFA policy checkpoint: `e8506fe799b72b453042ebbb77a8d3bafed4c613`
Real-stack identity tests: `69987c705944f088d6029cf1442f5de09197fd53`, `3c24177ea6f2186c1ece8908e26962809dc43e87`

## 1. Owner-approved authentication policy (supersedes earlier M3 MFA requirements)

- MFA is **optional for every role** in this release: SuperAdmin, Admin, Staff and Customer.
- Enforcement defaults to **disabled** for all four roles. It is set only by deployment configuration (`MfaEnforcement` section of `appsettings`). No application user, and no runtime database setting, can change it.
- When enforcement is disabled, the application does not send a level-2 authentication request, does not set an authenticator required action, and accepts password-based sessions.
- When enforcement is enabled for a role, the existing assurance validation is kept: missing or insufficient assurance is rejected at sign-in, at every session validation, and on token refresh. Token refresh never raises assurance.
- Authenticator (OTP) enrollment is **not** part of this release. OTP verification is an open limitation (section 6).

## 2. Verification

| Area | Result | Evidence |
|---|---|---|
| Backend integration tests (PostgreSQL 18, real migrations) | **165 executed, 165 passed, 0 failed, 0 skipped** | `dotnet test` on `Manada.IntegrationTests` |
| HTTP-level security tests (real pipeline, real cookie validation, PostgreSQL) | **31 executed, 31 passed** (included in the 165) | `Http/HttpSecurityTests.cs` |
| Concurrency and persistence recovery | Passed; repeated three times for stability | `Persistence/ConcurrencyRecoveryTests.cs`, concurrent sign-in and provisioning tests |
| Frontend unit and component tests | **115 executed, 115 passed** (mocked API; development fixtures, not browser certification) | `npx vitest run` from `/D/...` |
| Real-stack identity tests (Keycloak 26, PostgreSQL, API, Vite dev server, Mailpit, Chromium) | **9 executed, 9 passed, 0 failed, 0 skipped** | `npx playwright test -c playwright.identity.config.js e2e-identity/` |
| Full repository lint | **Exit 0** | `npx eslint .` |
| Production build | **Passes** | `npm run build` |
| Production fixture exclusion | **0 matches** in `dist` for preview and test markers (preview routes, sample names, test e-mail addresses, test password, portal loader) | string search over `dist` |
| Build warnings (backend) | 0 | `dotnet test` build output |

### 2.1 Real-stack browser verification (Chromium, real Keycloak password sign-in)

Accounts are created through the application's own flows: SuperAdmin invitation, administrator and staff creation through the portal UI, real invitation e-mails read from Mailpit, and the real set-password page. No authentication result is mocked.

- **SuperAdmin:** password sign-in; portal overview; administrator creation through the UI; search of the administrator list; audit log page; role change of an administrator to Staff through the role control; organization rename and restore; audit outcome filter; profile page shows the sessions list; a second, independent browser session of the same account is revoked from the profile page and the revoked session becomes unauthenticated; sign-out ends the session.
- **Administrator:** password sign-in; staff creation; staff activation, disablement and reactivation; SuperAdmin portal refused ("Access denied") and the administrator-listing API refused (403); profile and sessions shown; sign-out.
- **Staff:** password sign-in; staff dashboard; profile update saved; sessions shown; administrator portal refused ("Access denied") and the account-listing API refused (403); sign-out ends the session.
- **Customer:** password sign-in; customer dashboard; profile update saved (phone number); sessions shown; account-listing API refused (403); sign-out.

### 2.2 Authorization and session controls verified

- Valid, unknown, expired and absolute-lifetime sessions (HTTP tests).
- Session revocation after account disablement and after role change, triggered through the real API.
- Permission removal takes effect on the next authorized request.
- Insufficient and missing assurance rejected **when enforcement is enabled**; password-only sessions accepted for every role **under the default policy**.
- Token refresh does not raise assurance (refresh exercised with a stub token endpoint; under enforcement the session stays rejected).
- CSRF rejection for account creation, organization rename and session revocation; foreign origin rejected.
- Cross-user session revocation returns not found; session listing shows only the caller's sessions and never exposes cookie or session keys.
- Customer ownership, staff boundaries, administrator scope (SuperAdmin and peer administrators hidden as not found), row-version conflicts.
- Account disablement and permission revocation remain effective.

### 2.3 Persistence hardening

- Failed-entry recovery detaches only the failed account's own entries. An unrelated pending change stays tracked and is not discarded (regression test).
- Unique violations are classified by PostgreSQL SQLSTATE 23505 **and** the exact constraint name, behind the application's port. Duplicate e-mail is reported as a conflict only for the e-mail constraint. Unrelated database errors propagate. Check-constraint failures are never classified as unique violations.
- A concurrent sign-in of the same person reloads the existing identity when the e-mail index fires first.
- Failed identity-provisioning compensation (disabling the provider identity) is still exercised by tests.

## 3. Repository and tooling

- ESLint: the 24 findings in `e2e-identity` and `infra` were resolved by declaring Node globals for the `.mjs` Keycloak scripts and removing one unused fixture. No rules were disabled and no files were excluded. `npx eslint .` exits 0.
- Inherited M2 form-test synchronization: the deterministic form specification passes 8/8 in three consecutive runs (`npx playwright test e2e/forms.spec.js`).
- Windows drive-letter casing (Vitest): running from a lowercase `d:\` path fails at module load with `Cannot read properties of undefined (reading 'config')`. Running from the `/D/...` path works. **Workaround:** run `cd /D/Projects/manada-app && npx vitest run`. The root cause is in how the shell reports the drive letter to Vitest; it is not fixed by a dependency upgrade in this release.
- Identity tests run with `npx playwright test -c playwright.identity.config.js e2e-identity/` against the running dev server, Keycloak, PostgreSQL and Mailpit. They are serial because they share accounts and mailboxes.

## 4. Deferred work (documented, not claimed as verified)

1. **Authenticator (OTP) verification.** The TOTP key-derivation issue in the automated helper is unresolved. It is not a verified capability of this release, and it is not exposed to production users. Enrollment is not offered.
2. **Optional MFA activation.** The configuration switch exists, and the assurance validation is kept. Turning enforcement on for any role requires the Keycloak step-up flow and OTP enrollment to be verified end-to-end first (item 1). This was not done.
3. **OTP-dependent identity specs** (`e2e-identity/mfa.spec.js`, `e2e-identity/rbac-flow.spec.js`) are excluded from the identity configuration with a comment. They depend on authenticator enrollment and are superseded by the password-based role flows above.
4. **Responsive and targeted accessibility checks** for the new functional controls were not run in this pass. The approved M2 design review was not repeated, as instructed.
5. **Business modules** (products, inventory, orders, service requests, documents) are shown as "not available in this release" and have no data.

## 5. Findings

| Priority | Finding | Status |
|---|---|---|
| P2 | Access-denied pages have no sign-out control (the portal frame is not rendered). A signed-in user on an access-denied page must navigate to their own portal to sign out. | Open. Test navigates to the caller's portal first. |
| P2 | The `staff.mfa.enforced` database setting is still allowlisted and writable by SuperAdmin, but it no longer controls enforcement. It is misleading. | Open. Should be removed from the settings allowlist in a cleanup. |
| P2 | Two test files contain the local development test password as a constant (`Sample-Pass-2026!`) for the local Keycloak. It is not a production credential, but it is committed. | Open. Should move to an environment variable. |
| P2 | Vitest must be run from the `/D/...` path on this Windows environment (section 3). | Workaround documented. |
| P1 | None open. | |

## 6. Known limitation (open)

- OTP authentication is **not verified**. Authenticator enrollment is not offered to users. The current release does not depend on it, because MFA is optional.

## 7. Scope statement

- Local verification only. Nothing was pushed, no pull request was opened, nothing was merged into `main`, CI was not restored, and nothing was deployed.
- Real-stack tests run against the local development stack (Keycloak 26.4, PostgreSQL 18, Mailpit). They do not verify production infrastructure.
- Test-only identity seams (controlled session issuance through the framework's cookie sign-in, and application-level identity-provider fakes) are used only in the test host and are labelled as such. They are not present in production builds.

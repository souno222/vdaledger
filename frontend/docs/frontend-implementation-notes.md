# Frontend Implementation Notes

## Retained

- Next.js App Router route structure and protected `/app` boundary.
- Clerk sign-in, sign-up, identity, and sign-out flows.
- TanStack Query, React Hook Form, Zod, Lucide, and feature-folder architecture.
- Existing WebGL ledger shader, now reduced-motion aware and backed by a CSS/DOM fallback.
- Backend-authoritative product scope: upload evidence, ledger events, quantities, and tax reports.

## Reworked

- Replaced the generic styling with the exact `DESIGN.md` material, typography, spacing, shell, glass, motion, and responsive rules.
- Rebuilt navigation drawers with dialog semantics, focus trapping/restoration, Escape handling, and scroll locking.
- Consolidated transport behind one authenticated client and feature-local endpoint modules.
- Added Clerk readiness gates, request cancellation, identity-scoped query keys, cache clearing on identity changes, and conservative retry behavior.
- Added strict path/origin guards, fresh-token authorization replacement, public-call credential stripping, safe error normalization, and response security headers.
- Added lossless JSON-number parsing and string-based Indian-number formatting so backend `BigDecimal` values never round through JavaScript `number`.
- Corrected the current financial-year default and exclusive-period-end language.
- Replaced network-fetched Google fonts with the installed Geist package.
- Expanded unit, endpoint-contract, responsive, keyboard, overflow, and response-header verification.
- Added Clerk's official Playwright helper and a real authenticated dashboard/sign-out suite.
- Corrected the local Spring `CLERK_ISSUER_URI` so it matches the Clerk instance used by the frontend publishable key and backend JWKS.
- Split missing frontend sessions from backend-rejected bearer tokens in user-facing diagnostics.
- Removed the product UI's raw `/api/users/me` request; dashboard/profile now use only Clerk's safe email and account timestamp, and authenticated regression coverage rejects either identifier in rendered output.

## Removed

- Runtime/E2E Clerk bypass behavior from the application provider and middleware paths.
- The monolithic endpoint-string module.
- Stale Create Next App assets and obsolete setup guidance.
- Stale claims that backend CORS was missing.
- Generic server-detail display and unsafe caller-controlled authorization behavior.
- The current-user API endpoint module, schema, type, query key, React Query hook, and all Clerk/internal user ID presentation.

## Design deviations

No unavoidable design deviation was accepted.

Lucide remains the single icon set because it is already installed, linear, and consistently satisfies the specified icon language. No emoji or second icon system was introduced.

## Verified results

- `npm run typecheck`: pass.
- `npm run lint`: pass with zero warnings.
- `npm run test:run`: 33 tests across 7 files pass.
- `npm run test:e2e`: 9 checks pass; 3 wider-breakpoint mobile-menu checks are intentionally skipped.
- `npm run test:e2e:auth`: 2 checks pass using a real Clerk development session and the running Spring API. The suite verifies bearer headers and HTTP 200 responses for ingestions, ledger, portfolio, and tax; verifies dashboard/profile do not request `/api/users/me` or render either user identifier; then verifies sign-out protection.
- `npm run build`: pass with all routes generated.
- Visual inspection: 390px mobile and 1440px desktop full-page captures match the design contract and have no horizontal overflow.

## Authentication incident and root cause

The initial completion report was incorrect because it relied on API-client unit tests and public browser checks without executing a real Clerk-to-Spring request. When the backend was later started, its local `CLERK_ISSUER_URI` was still `https://replace-with-your-clerk-domain`, while the frontend key and backend JWKS both targeted `current-eel-2.clerk.accounts.dev`. Spring correctly rejected every token on issuer validation. The error UI then made the problem harder to diagnose by presenting all HTTP 401 responses as an expired frontend session.

Both failures are now covered: local configuration uses the matching issuer, the UI distinguishes missing sessions from backend token rejection, and `npm run test:e2e:auth` fails unless a real Clerk token is accepted by the live backend.

## Local redirect-loop incident

The frontend was temporarily restarted inside a network-restricted desktop sandbox after a production build. Clerk's server-side development handshake then failed with `EACCES`; the SDK reported that session-token refresh had entered an infinite redirect loop even though the frontend publishable key and server secret key matched.

The live Next.js process now runs with the outbound access required for Clerk's development handshake. The authenticated browser regression also visits `/sign-in` after establishing a real session and fails unless Clerk redirects exactly once to `/app/dashboard`, protected API data loads, and sign-out returns the browser to the protected-route boundary.

## Remaining acceptance boundary

Authenticated read paths and sign-out are verified. The suite does not upload a CSV because that mutates ledger state; upload-to-ingestion-to-tax verification still requires an intentionally chosen disposable CSV fixture.

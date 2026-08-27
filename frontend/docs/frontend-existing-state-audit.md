# Frontend Existing-State Audit

Date: 2026-07-18

## Repository and baseline

- Frontend root: `frontend/`
- Backend root: `backend/`
- Package manager: npm (`frontend/package-lock.json`)
- Router: Next.js App Router under `frontend/src/app`
- Git repository: `frontend/.git`
- Working tree at audit time: heavily modified from the initial Create Next App commit. The existing uncommitted frontend is treated as user work and is being remediated in place.
- Root-level `VDA_Ledger/.git` is not a valid repository; Git status is therefore recorded from `frontend/`.

Baseline commands before this rework:

| Command | Result |
|---|---|
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:run` | Passed: 5 files, 13 tests |
| `npm run build` | Failed only because the sandbox could not download Geist and Geist Mono from Google Fonts |

The build failure is pre-existing and environmental, but remote font fetching is also an avoidable build dependency. The remediation will use locally available Geist assets or a no-network fallback.

## Current stack

- Next.js 16.2.10
- React 19.2.4
- TypeScript 5 with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`
- Tailwind CSS 4
- Clerk Next.js 7.5.19
- TanStack Query 5.101.2
- React Hook Form 7.81.0 with Zod 4.4.3
- Vitest, Testing Library, MSW, and Playwright
- Lucide linear icons

The repository-specific Next.js 16 documentation was inspected before implementation, including App Router structure, layouts/pages, server and client component boundaries, and environment-variable behavior.

## Current routes

| Route | Current feature |
|---|---|
| `/` | Public product/marketing page |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |
| `/app` | Protected redirect to `/app/dashboard` |
| `/app/dashboard` | Multi-endpoint account summary |
| `/app/upload` | Synchronous Binance and CoinDCX CSV ingestion |
| `/app/ingestions` | Full ingestion history with client-side presentation filters |
| `/app/ingestions/[jobId]` | Owned job details and persisted row errors |
| `/app/ledger` | Full ledger list with client-side presentation filters |
| `/app/portfolio` | Backend-computed non-zero quantities |
| `/app/tax` | Backend-computed report for a supported financial year |
| `/app/profile` | Backend identity plus Clerk account UI |

## Working and reusable implementation

- App Router route groups and protected `/app` layout.
- Clerk `auth.protect()` guards on protected layouts/pages.
- TanStack Query remote-state model and mutation invalidation.
- React Hook Form upload flow, selected-file preservation, and duplicate-submit prevention.
- One existing API-client entry point instead of component-level raw fetch calls.
- Runtime Zod response validation.
- Feature views for all implemented backend areas.
- Loading, empty, and error components.
- Desktop tables plus mobile card alternatives.
- The landing WebGL shader with DPR clamp, low-power preference, reduced-motion handling, and CSS fallback.
- Existing route destinations and useful UI composition.

## API and security findings

1. `createApiClient` always assumes protected authentication and has no explicit public/optional mode.
2. TanStack Query abort signals are not forwarded, so obsolete requests continue after navigation or parameter changes.
3. Queries are not gated on Clerk `isLoaded`/`isSignedIn`.
4. Query cache is not explicitly cleared when the authenticated user changes or signs out, allowing stale user-specific data to remain in memory.
5. `new URL(path, baseUrl)` accepts an absolute caller-controlled URL. The current endpoint constants are internal, but the client should still reject cross-origin paths before attaching a bearer token.
6. Only JSON error bodies are read. Text and empty errors lose useful classification.
7. Fetch/network failures are not converted into a typed connectivity/configuration error.
8. Successful empty responses are not supported.
9. Backend BigDecimal JSON values are parsed through native `JSON.parse`, which can lose decimal precision before Zod sees them.
10. Backend 5xx or malformed-request detail can be displayed without an explicit safe-message policy.
11. Dynamic ingestion job IDs are interpolated without path encoding and are not validated before requests.
12. Endpoint construction is centralized as strings, but feature-specific request functions and endpoint-level tests are missing.
13. The test-only Clerk bypass branch is embedded in production layout/proxy code. It is unnecessary for public-page tests and should be removed.
14. `.env.example` contains development/test key values rather than placeholders. They are not production credentials, but the governing workplan requires placeholder-only examples.

No local/session storage token handling, hardcoded bearer token, arbitrary `userId` request field, or component-level protected fetch bypass was found.

## API correctness findings

- The tax UI labels `periodEndExclusive` as the visible end of a date range without explaining exclusivity.
- The default dashboard tax year is `2025-2026`, while the latest backend-supported financial year is `2026-2027`.
- Query cancellation is not active even though the underlying fetch client accepts `RequestInit`.
- Error rendering does not clearly distinguish authentication, authorization, rate limiting, network/configuration, and backend failure states.
- Profile and dashboard requests can begin while the Clerk client is still hydrating.
- README CORS guidance is stale: the backend now includes a CORS filter.

## Design findings

The current implementation already uses the correct broad dark-green/lime direction and contains reusable glass components. The following gaps remain against `.agents/DESIGN.md` and `.agents/WORKPLAN.md`:

- The landing display type exceeds the specified 54.4px display token by a large margin.
- The hero gradient shell uses a lime center instead of the specified dark-green 160-degree shell recipe.
- Repeated values are only partially semantic; background, foreground, surface, border, and state roles need explicit variables.
- Glass panels use `rgba(..., 0.075)` rather than the specified `rgba(..., 0.09)` recipe.
- Card border width, blur, padding variants, and elevation are not encoded as one reusable material recipe.
- Application-shell mobile navigation lacks Escape handling, focus management, scroll locking, and dialog semantics.
- Landing mobile navigation uses a bare `details` menu and lacks the same controlled accessible-drawer behavior.
- Many headings and section gaps use arbitrary larger values rather than the documented typography and compact grid rhythm.
- The authenticated shell has a static CSS field but no named atmospheric layer shared with the material system.

## Responsive and accessibility findings

Working:

- Mobile alternatives exist for ledger and ingestion tables.
- Controls generally meet a 44px touch target.
- Visible focus styles and semantic table markup are present.
- Status badges include icon and text.
- Reduced-motion CSS and WebGL handling exist.

Needs repair:

- Mobile drawers need Escape-to-close, focus placement/restoration, and background scroll lock.
- The file drop region is not itself a keyboard-operable control; only the nested browse button is.
- Loading skeleton containers are visually hidden from assistive technology but views lack a consistent announced loading status.
- Error presentation needs status-specific accessible titles and actions.
- Authenticated data cache cleanup needs to follow identity changes.

## Files to preserve

- Existing App Router route structure.
- `src/features/**` page-level business composition.
- `src/providers/AppProviders.tsx` and TanStack Query usage.
- `src/components/marketing/webgl-backdrop.tsx`.
- `src/lib/dates.ts`, `src/lib/status.ts`, and test infrastructure.
- Clerk sign-in/sign-up components and profile UI.

## Files to rework

- `src/lib/api/**`
- `src/hooks/use-api.ts`
- `src/providers/AppProviders.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/proxy.ts`
- shared primitives, feedback states, and app shell
- all feature views where API state, precision, period labels, or strict design tokens require correction
- `.env.example`, Playwright setup, README, and tests

## Files safe to remove

- `src/config/env.server.ts` is unused and duplicates Clerk's server-environment ownership. It may be removed after confirming no import remains.
- Generated test output should be ignored. Existing untracked artifacts will not be destructively deleted without separate need.

# Frontend Route Remediation Matrix

| Route | Result | Backend dependency | Auth | Remediation completed |
|---|---|---|---|---|
| `/` | Complete | None | Public | Applied display cap, forest/lime system, approved gradient shells, exact glass recipe, responsive composition, and accessible mobile drawer; removed the runtime auth bypass. |
| `/sign-in` | Complete | Clerk | Public | Retained Clerk behavior and placed the component in the shared atmospheric gradient composition. |
| `/sign-up` | Complete | Clerk | Public | Retained Clerk behavior and placed the component in the shared atmospheric gradient composition. |
| `/app` | Complete | Clerk | Protected | Retained redirect and protected layout boundary. |
| `/app/dashboard` | Complete | Clerk, ingestions, ledger, portfolio, tax | Protected | Uses Clerk's safe email field for the greeting plus cancellable, user-scoped API queries; current FY; independent states; and major summary shell. |
| `/app/upload` | Complete | `POST /api/ingestions` | Protected | Uses exact multipart fields, typed error states, accessible file controls, current invalidation roots, and approved major shell. |
| `/app/ingestions` | Complete | `GET /api/ingestions` | Protected | Retained presentation filters and moved transport to the authenticated cancellable endpoint module. |
| `/app/ingestions/[jobId]` | Complete | Detail and error endpoints | Protected | Validates UUID before transport, encodes path data, waits for valid detail before requesting errors, and distinguishes not-found/access/rate/server states. |
| `/app/ledger` | Complete | `GET /api/ledger-events` | Protected | Uses the verified endpoint, exact decimal strings, and presentation-only filters. |
| `/app/portfolio` | Complete | `GET /api/portfolio/summary` | Protected | Uses exact quantity strings and honest quantity-only language without pricing or performance claims. |
| `/app/tax` | Complete | `GET /api/taxes/liability` | Protected | Uses backend-supported years, defaults to `2026-2027`, labels the exclusive period end correctly, preserves decimal precision, and uses one major result shell. |
| `/app/profile` | Complete | Clerk | Protected | Shows only Clerk-managed email/account age and settings; does not request the raw backend identity record or render Clerk/internal user identifiers. |

No route was removed, no mock feature replaced backend data, and no frontend financial calculation was introduced.

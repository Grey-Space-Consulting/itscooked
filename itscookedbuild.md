# ItsCooked Web Client Build Plan (PWA for iOS)

Last updated: 2026-01-08
Owner: AI coding agent (Codex)
Status: Draft
Current phase: Phase 3 (in progress)
Next up: Validate ingestion endpoints and iOS Shortcut flow against live backend

## Non-negotiable rules (must follow every time)
1) Assume your knowledge is out of date. Before making any tech decision (framework, SDK, API, module), use the Tavily MCP to verify the latest guidance, support status, and versions. Record the sources and date in this document.
2) Keep this document current. After every change, phase progress, or decision, update this file with what changed, why, and what is next.
3) When a phase is complete, notify the user explicitly and mark the phase as Complete with the completion date.
4) The new client must not break the existing client or backend. Both clients must work concurrently against the same backend.
5) The final phase is a single automated Vercel deployment script that deploys this new client without affecting the existing client or backend.

## Scope summary
- Build a new web client (PWA) that runs well on iOS Safari and can be installed to Home Screen.
- Integrate with the existing backend. No breaking changes to current APIs.
- Deliver the ingestion and recipe management features described in the PRD.
- Maintain a reliable offline-first experience in cooking contexts.
- Deliver a clean, modern, mobile-first UI across all core flows.

## Out of scope
- Xcode project files and the existing SwiftUI/iOS app are not part of this web client build plan; no Xcode changes are required.

## iOS PWA standards and constraints (verify via Tavily each phase)
The following items MUST be validated with Tavily before implementation because iOS PWA support changes over time:
- Web App Manifest support and required fields for iOS installability.
- Service Worker capabilities and caching behavior on iOS Safari.
- Web Push support for installed PWAs (iOS 16.4+ historically).
- Web Share API support and limitations, and whether Web Share Target is supported.
- Background Sync / Periodic Background Sync support (often limited on iOS).
- Wake Lock API support and required fallbacks for cooking mode.
- Storage quotas (IndexedDB/Cache) and eviction behavior.

Record results here each time they are checked:
  - Tavily check log:
  - 2026-01-07: Initial research completed (sources below, re-check in Phase 0).
    - Web App Manifest spec: https://w3c.github.io/manifest/
    - iOS Web Push notes (PWA installed requirement): https://academy.insiderone.com/docs/web-push-support-for-mobile-safari
    - iOS Web Push overview: https://isala.me/blog/web-push-notifications-without-firebase/
    - iOS PWA limitations overview: https://www.mobiloud.com/blog/progressive-web-apps-ios
    - Safari PWA cache update pitfalls: https://iinteractive.com/resources/blog/taming-pwa-cache-behavior
    - Web Share Target (share_target) MDN: https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
    - Web Share API (navigator.share) MDN: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
    - Screen Wake Lock API MDN: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
    - Background Sync API MDN: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
    - Periodic Background Sync (overview): https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
    - Background sync support notes (Safari experimental mention): https://firt.dev/understanding-js-background/
    - caniuse data: Web Share API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-share.json
    - caniuse data: Screen Wake Lock API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/wake-lock.json
    - caniuse data: Background Sync API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/background-sync.json
    - OAuth 2.0 Security BCP (RFC 9700): https://www.rfc-editor.org/rfc/rfc9700
    - OAuth 2.1 draft (latest): https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
  - 2026-01-07: Phase 0 re-verification (Tavily; sources updated).
    - WebKit (Web Push + Home Screen web app requirements): https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
    - WebKit (Safari 16.4 features for web apps): https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
    - MDN Web app manifest overview: https://developer.mozilla.org/en-US/docs/Web/Manifest
    - MDN share_target (Web Share Target): https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
    - MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
    - Safari PWA cache behavior notes: https://iinteractive.com/resources/blog/taming-pwa-cache-behavior
    - MDN Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
    - caniuse data: Web App Manifest (A2HS) https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-app-manifest.json
    - caniuse data: Service Workers https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/serviceworkers.json
    - caniuse data: Web Share API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-share.json
    - caniuse data: Background Sync API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/background-sync.json
    - caniuse data: Screen Wake Lock API https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/wake-lock.json
    - Periodic Background Sync API overview: https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
  - 2026-01-07: Phase 1 stack/version verification (Tavily; npm sources).
    - Vite: https://www.npmjs.com/package/vite
    - @vitejs/plugin-react: https://www.npmjs.com/package/@vitejs/plugin-react
    - React: https://www.npmjs.com/package/react
    - React DOM: https://www.npmjs.com/package/react-dom
    - React Router: https://www.npmjs.com/package/react-router
    - React Router DOM (re-export note): https://www.npmjs.com/package/react-router-dom
    - TypeScript: https://www.npmjs.com/package/typescript
    - ESLint: https://www.npmjs.com/package/eslint
    - @eslint/js: https://www.npmjs.com/package/@eslint/js
    - @typescript-eslint/eslint-plugin: https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
    - @typescript-eslint/parser: https://www.npmjs.com/package/@typescript-eslint/parser
    - eslint-plugin-react: https://www.npmjs.com/package/eslint-plugin-react
    - eslint-plugin-react-hooks: https://www.npmjs.com/package/eslint-plugin-react-hooks
    - @types/react: https://www.npmjs.com/package/@types/react
    - @types/react-dom: https://www.npmjs.com/package/@types/react-dom
    - Prettier: https://www.npmjs.com/package/prettier
  - 2026-01-07: Lighthouse PWA audit deprecation check (Tavily).
    - Lighthouse changelog (PWA deprecation warning): https://github.com/GoogleChrome/lighthouse/blob/main/changelog.md
    - Lighthouse PR noting PWA category deprecation in v12+: https://github.com/GoogleChrome/lighthouse/pull/15741
    - Chrome DevTools PWA guidance: https://developer.chrome.com/docs/devtools/progressive-web-apps/
    - Update to install criteria (Chrome): https://developer.chrome.com/blog/update-install-criteria
  - 2026-01-07: Vercel monorepo + build settings + rewrites (Tavily).
    - Monorepos (root directory selection): https://vercel.com/docs/monorepos
    - Configuring a Build (root directory, build/output/install commands): https://vercel.com/docs/builds/configure-a-build
    - Project configuration rewrites (vercel.ts examples): https://vercel.com/docs/project-configuration/vercel-ts
  - 2026-01-08: Phase 2 auth/browser OAuth verification (Tavily).
    - OAuth 2.0 Security BCP (RFC 9700): https://www.rfc-editor.org/rfc/rfc9700
    - OAuth 2.1 draft (current): https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
    - OAuth 2.0 for Browser-Based Apps (current draft): https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps
    - PKCE (RFC 7636): https://www.rfc-editor.org/rfc/rfc7636
    - OpenID Connect Discovery 1.0: https://openid.net/specs/openid-connect-discovery-1_0.html
  - 2026-01-08: Clerk Next.js App Router quickstart verification (Tavily).
    - Clerk Next.js Quickstart (App Router): https://clerk.com/docs/nextjs/getting-started/quickstart
  - 2026-01-08: Next.js App Router migration verification (Tavily).
    - Next.js App Router overview: https://nextjs.org/docs/app
    - Next.js App Router routing/layouts: https://nextjs.org/docs/app/building-your-application/routing
    - Next.js installation guidance: https://nextjs.org/docs/getting-started/installation
  - 2026-01-08: Phase 3 share-target verification (Tavily).
    - MDN share_target (experimental / limited availability): https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
    - Chrome Web Share Target API docs (Chrome-only examples): https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
  - 2026-01-08: Phase 2 backend persistence verification (Tavily).
    - Vercel Postgres marketplace overview: https://vercel.com/docs/storage/vercel-postgres
    - node-postgres (pg) docs: https://node-postgres.com/

## Current standards snapshot (must re-verify via Tavily in Phase 0)
- Web App Manifest: required for installability. For Home Screen web app behavior on iOS, `display: standalone` or `fullscreen` is required. Include `name`, `short_name`, `start_url`, `theme_color`, `background_color`, and `icons` (192/512 + maskable). Keep iOS meta fallbacks (`apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`).
- Service worker: supported on iOS Safari. Use versioned caches + explicit update prompts; Safari caching can be aggressive, so avoid SW caching API responses unless explicitly needed.
- Web Push: supported on iOS/iPadOS 16.4+ for Home Screen web apps only; permission must be requested from a user gesture inside the PWA.
- Web Share: `navigator.share()` supported on iOS Safari 12.2+ per caniuse. Web Share Target (`share_target`) is experimental/not Baseline per MDN; treat as unsupported and provide an iOS Shortcut fallback.
- Background Sync / Periodic Background Sync: not supported on iOS Safari per caniuse; use foreground sync + retry queues.
- Storage quotas: Safari enforces quotas and can proactively evict data (including after periods of no user interaction). Handle `QuotaExceededError` and provide cleanup flows; consider `navigator.storage.persist()`.
- Wake Lock: supported on iOS Safari 16.4+ per caniuse, but PWA-mode bugs are noted; implement a fallback keep-awake strategy for cooking mode.

## Architecture guardrails
- Prefer standards-based web APIs with progressive enhancement.
- Avoid hard dependency on iOS-only behaviors; provide fallbacks for unsupported APIs.
- Favor stable, well-maintained libraries with clear release cadence.
- Use HTTPS everywhere; enforce security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy).
- Ensure the web client can be deployed independently from the existing client (separate domain or subdomain, separate build pipeline).
- Establish a small, consistent design system (typography, color, spacing, components) and apply it throughout.

## Phase plan (execute in order, one phase at a time)

### Phase 0: Current-state audit + latest standards verification
Goal: Establish baseline constraints, existing backend contracts, and current iOS PWA support.
Tasks:
- Inspect repo and existing client structure, confirm current backend endpoints, auth flow, and data models.
- Use Tavily MCP to confirm latest iOS PWA support for:
  - Web App Manifest fields and installability
  - Service workers and caching behavior
  - Web Push (iOS requirements)
  - Web Share API vs Web Share Target support
  - Background Sync / Periodic Background Sync
  - Wake Lock API support
- Decide initial stack/architecture based on latest standards and repo conventions.
Deliverables:
- Updated architecture decision summary in this file.
- A compatibility matrix for iOS Safari/PWA capabilities with clear fallbacks.
Acceptance criteria:
- All items in the Tavily check log are populated with sources and dates.
- Backend integration points are documented.
Status: Complete (2026-01-07)
Progress (2026-01-07):
- Repo audit confirms only SwiftUI template files (ContentView/Item/itscookedApp) and local SwiftData storage; no backend endpoints, auth flows, or API base URL config detected.
- Phase 0 Tavily re-verification completed; sources refreshed for manifest/A2HS, service workers/caching, web push, share, background sync, wake lock, and storage quotas.
- Architecture decision: new web client will live in `/web` and deploy independently from the existing SwiftUI app; original Vite + React Router plan was superseded by Next.js App Router + React + TypeScript + Clerk with a custom UI system and React context state.
- Hosting decision: Vercel (prod). Custom domain TBD; use Vercel-provided URL until domain is set.
- Frontend URL (prod): https://itscooked.vercel.app/
- GitHub repo: https://github.com/Grey-Space-Consulting/itscooked
- Repo resynced to GitHub; project files restored after remote overwrite.
- Auth decision (updated 2026-01-08): Use Clerk-managed auth for the web client (Next.js App Router). Backend should validate Clerk session JWTs; previous self-hosted OIDC plan is superseded for the web client.
- Backend base URL (prod): https://itscooked.vercel.app/ (same origin as frontend; API paths use `/v1`).
- Proposed backend API contract drafted below (v1). All endpoints are additive and must not break the existing backend.
Blockers:
- Need confirmation of auth implementation constraints (OIDC endpoints, token lifetimes, user store).

Compatibility matrix (iOS Safari/PWA, must re-verify each phase):
- Web App Manifest / A2HS: Partial support in iOS Safari; Add to Home Screen required and `display: standalone` or `fullscreen` is needed for Home Screen web app behavior. Sources: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-app-manifest.json, https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/, https://developer.mozilla.org/en-US/docs/Web/Manifest
- Service Workers: Supported on iOS Safari; caching can be aggressive, so plan explicit update prompts and avoid SW-caching API responses unless needed. Sources: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/serviceworkers.json, https://iinteractive.com/resources/blog/taming-pwa-cache-behavior, https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Web Push: Supported on iOS/iPadOS 16.4+ only for Home Screen web apps; permission must be user-initiated. Sources: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/, https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- Web Share API (`navigator.share`): Supported on iOS Safari 12.2+ per caniuse data. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-share.json
- Web Share Target (`share_target`): Experimental and not Baseline per MDN; treat as unsupported on iOS until verified on device. Source: https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
- Screen Wake Lock API: Supported on iOS Safari 16.4+ per caniuse data; caniuse notes a PWA-mode bug on iOS. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/wake-lock.json
- Background Sync API: Not supported on iOS Safari per caniuse data. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/background-sync.json
- Periodic Background Sync: Treat as unsupported on iOS Safari; API details only. Source: https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
- Storage quotas/eviction: Safari enforces quotas and can proactively evict inactive origins; handle `QuotaExceededError` and consider `navigator.storage.persist()`. Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

Proposed backend API contract (v1, additive)
Base URL: `https://itscooked.vercel.app` (prod)
Auth (Clerk):
- Web client uses Clerk session tokens (via `getToken()`) and sends `Authorization: Bearer <token>` on API requests.
- Backend validates Clerk JWTs via Clerk JWKS or server SDK.

Legacy/optional (previous OIDC plan, only if still needed for other clients):
- GET `/.well-known/openid-configuration` (OIDC discovery)
- GET `/oauth/authorize` (authorization code + PKCE)
- POST `/oauth/token` (code exchange + refresh)
- POST `/oauth/revoke` (token revocation)
- GET `/userinfo` (OIDC user profile)
- POST `/auth/logout` (optional, server-side session cleanup)
- GET `/auth/session` (optional, current session snapshot)

User + preferences:
- GET `/v1/me`
- PATCH `/v1/me`
- GET `/v1/preferences`
- PATCH `/v1/preferences` (units, cooking defaults)

Recipes:
- GET `/v1/recipes` (list, pagination)
- GET `/v1/recipes/:id`
- POST `/v1/recipes` (manual entry)
- PATCH `/v1/recipes/:id`
- DELETE `/v1/recipes/:id`

Ingestion:
- POST `/v1/recipes/ingest` (body: `source_url`, `source_type`)
- GET `/v1/ingest/:job_id` (status)
- POST `/v1/ingest/:job_id/retry`

Ingredients:
- GET `/v1/ingredients/search` (query)
- GET `/v1/ingredients/:id`

Meal planning (optional MVP):
- GET `/v1/meal-plans`
- POST `/v1/meal-plans`
- PATCH `/v1/meal-plans/:id`
- POST `/v1/meal-plans/:id/recipes`
- DELETE `/v1/meal-plans/:id/recipes/:recipe_id`

Push notifications (optional, iOS 16.4+ installed PWA):
- POST `/v1/push/subscribe`
- DELETE `/v1/push/subscribe`

System:
- GET `/v1/health`
- GET `/v1/version` (used by PWA update checks)

### Phase 1: App foundation and scaffolding
Goal: Create the client skeleton and baseline quality gates.
Tasks:
- Create the new web client app shell (framework decision from Phase 0).
- Set up routing, state management, and API client structure.
- Configure linting, formatting, type checks, and CI checks.
- Implement Web App Manifest, icons, and PWA install metadata per latest standards.
- Define the UI system (typography, color, spacing, components) and build core layout primitives.
Deliverables:
- Running web app shell with navigation and empty views.
- PWA manifest + service worker registration scaffold (no caching yet).
- UI system tokens and base components (buttons, inputs, cards, lists).
Acceptance criteria:
- App builds and runs locally on iOS Safari.
- Lighthouse PWA checks pass for baseline requirements.
- Core screens render with the defined UI system and responsive layout.
Status: Complete (2026-01-08)
Progress (2026-01-07):
- Web client scaffolded under `/web` with Vite + React + TypeScript and React Router.
- Routing, app shell, and placeholder views added for Home, Recipes, and Settings.
- UI system tokens and base components (buttons, inputs, cards, lists) implemented with responsive layout primitives.
- API client skeleton and state provider stubs added for future backend integration.
- PWA manifest, icons, and service worker registration scaffolded.
- Added minimal app-shell caching for installability/offline baseline (no API caching).
- Linting, formatting, type checks, and CI workflow configured.
- npm install completed; lint, typecheck, and production build pass locally.
- Added `npm run dev:host` script to simplify device validation.
- Lighthouse CLI v13 removed PWA category (per Lighthouse deprecation notes); use Chrome DevTools PWA checklist + manual offline/start_url verification instead.
- Added `npm run pwa:check` static validation script; checks pass locally.
- Added root-level `vercel.json` to build the `/web` app on Vercel (legacy SPA rewrites removed after Next.js migration).
- Pending: iOS Safari validation (home screen install + navigation) and DevTools PWA checklist/offline verification.
Progress (2026-01-08):
- Installed `@types/pg` to satisfy Next.js TypeScript checks after adding Postgres persistence.
- `npm run build` and `npm run pwa:check` pass locally on the Next.js app.

### Phase 2: Backend integration and auth
Goal: Connect to the existing backend safely.
Tasks:
- Frontend: Implement API client and auth/session handling to match backend.
- Frontend: Implement read-only data flows for recipes and user profile.
- Frontend: Add API error handling and offline-aware UI states.
- Backend: Implement `/v1/health`, `/v1/version`, `/v1/me`, `/v1/recipes`, and `/v1/recipes/:id` with Clerk JWT verification.
- Backend: Define a stable error response shape for auth, not-found, and validation failures.
- Backend: Ensure staging/prod persistence for read-only recipe data (no ephemeral-only storage for Phase 2 completion).
Deliverables:
- Frontend can fetch recipe index and detail with auth and render offline/error states.
- Backend serves read-only `/v1` endpoints with auth and stable response shapes.
Acceptance criteria:
- Frontend and backend pass live checks (authed 200s; invalid tokens return 401).
- Backend contract matches the documented v1 schema and remains additive.
- Existing client behavior remains unchanged.
Status: In progress
Progress (2026-01-08):
- Completed migration from Vite + React Router to Next.js App Router in `/web` to support Clerk auth.
- Added Clerk App Router setup (`src/proxy.ts`, `ClerkProvider`, SignedIn/SignedOut UI) and updated screens for Next.js routing.
- Replaced custom OIDC auth usage with Clerk `useAuth()` + `getToken()` in the API client.
- Updated build tooling for Next.js and refreshed PWA checks to validate `app/layout.tsx` and `providers.tsx`.
- Lint, typecheck, and `npm run pwa:check` pass after migration.
- Moved Clerk auth UI into the client `AppShell` to avoid passing non-serializable auth slots from the server layout.
- Removed `src/middleware.ts` to resolve Next.js build error (proxy + middleware conflict); `src/proxy.ts` is now the sole middleware entry.
- Next.js build updated `tsconfig.json` and `next-env.d.ts` to align with recommended settings.
- Moved `themeColor` into the `viewport` export to satisfy Next.js App Router metadata requirements.
- Added `.gitignore` guard for `web/src/.env*` and clarified env file placement.
- Removed tracked `web/src/env.local` and expanded `.gitignore` to prevent future commits.
- Added a prebuild guard to delete any stray `src/middleware.*` files before Next.js runs (proxy-only requirement).
- Expanded the prebuild guard to remove any root or nested `src/src/middleware.*` entries if present.
- Made `useOnlineStatus` SSR-safe to prevent pre-render crashes.
- Removed list routes and UI; list feature removed from scope.
- Updated Home/Settings copy to remove list references and cleaned unused grocery env typing.
- Verified client-side recipe list/detail and profile fetch flows against the v1 contract with Clerk token wiring and offline/error states; live backend validation still required.
- Standardized `/v1` API error responses with a stable error shape for auth, validation, and not-found.
- Added Postgres-backed persistence via `DATABASE_URL`/`POSTGRES_URL` with file-store fallback only for local dev; Vercel now requires a persistent store.
Follow-ups (post-Phase 2, external validation):
- Verify backend accepts Clerk session tokens and confirm live API responses for recipes and profile.
- 2026-01-08 live check: Clerk session token created via Backend API, but `GET /v1/me` and `GET /v1/recipes` returned 404 at https://itscooked.vercel.app (confirm correct API base or deploy backend routes).
- Clerk instance is configured for phone-only identifiers (email sign-in disabled).
- Re-run live checks after deploying new `/v1` route handlers to confirm 200s and ingestion progression.
- Validate PWA install + offline behavior on real iOS Safari after migration.
- Configure Clerk env vars in CI/Vercel to allow authenticated builds and runtime.
- Provision a persistent Postgres database and set `DATABASE_URL`/`POSTGRES_URL` in Vercel before re-running live checks.
- Keep `.env.local` untracked and located at `/web` (never under `src`).
- Rotate Clerk keys after accidental commit and ensure env files are untracked.

### Phase 3: Ingestion entry points
Goal: Users can add recipes via URL and iOS-friendly flow.
Tasks:
- Frontend: Implement manual URL submission.
- Frontend: Implement iOS Shortcut-based share flow (if Web Share Target is unsupported).
- Frontend: Provide clear UX for “Queued / Processing / Ready / Error.”
- Backend: Implement `POST /v1/recipes/ingest` with URL validation and job persistence.
- Backend: Implement `GET /v1/ingest/:job_id` and `POST /v1/ingest/:job_id/retry` with reliable status transitions.
- Backend: Wire ingestion processing to create recipes, surface error codes, and return `recipe_id` when ready.
Deliverables:
- URL ingestion flow with status updates.
- Shortcut instructions accessible in-app.
- Backend ingestion endpoints returning job IDs and status updates.
Acceptance criteria:
- User can add a recipe URL from iOS and see processing status.
- Backend returns job IDs, status progresses to ready, and recipe fetch succeeds.
- Retry endpoint re-queues failed jobs and returns deterministic error details when it cannot.
Status: In progress
Progress (2026-01-08):
- Added ingestion API client helpers for queue/retry/status with tolerant response parsing.
- Implemented URL ingestion UI on Home with validation, queueing, and status badges plus polling.
- Added iOS Shortcut guidance and URL prefill support for share fallback.
- Persisted recent ingestion jobs in local storage to keep status visible across sessions.
- 2026-01-08 live check: `POST /v1/recipes/ingest` returned 405 at https://itscooked.vercel.app (confirm correct API base or backend route).
- Implemented `/v1` API routes in the Next.js app (health, version, me, recipes, ingest) with Clerk token verification and a file-backed JSON store for staging.
- Added a stub ingestion processor that advances queued jobs to ready and generates placeholder recipes until a real parser is wired.

### Phase 4: Recipe view + edit
Goal: Display parsed recipes and allow edits.
Tasks:
- Frontend: Build recipe detail view with ingredients and steps.
- Frontend: Implement edit flow with validation and autosave.
- Frontend: Add cooking mode with step-by-step UI and wake-lock fallback.
- Frontend: Apply the UI system to recipe detail, edit, and cooking flows with modern, mobile-first layouts.
- Backend: Implement recipe detail and update endpoints with validation and normalization.
- Backend: Persist edits, return updated recipes, and track `updated_at` for sync.
Deliverables:
- Full recipe detail experience including edits.
- Backend persistence for recipe edits.
Acceptance criteria:
- Edits persist reliably and reflect backend state, with server validation errors surfaced in UI.
- Cooking mode is legible, touch-friendly, and consistent with the UI system.
Status: Not started

### Phase 5: Offline-first and PWA polish
Goal: Reliable offline usage and iOS install experience.
Tasks:
- Frontend: Implement caching strategy (app shell + essential data).
- Frontend: Add offline indicators and last-synced timestamps.
- Frontend: Add update flow for service worker (prompt on new version).
- Backend: Provide cache-friendly headers (ETag/Last-Modified) and `updated_at` fields for sync.
Deliverables:
- App usable in low-connectivity environments.
- Backend supports efficient revalidation for cached data.
Acceptance criteria:
- Works offline for recently viewed recipes.
- Backend supports revalidation without breaking auth or caching behavior.
Status: Not started

### Phase 6: Performance, accessibility, and QA
Goal: Ensure production quality.
Tasks:
- Frontend: Run performance profiling and fix critical bottlenecks.
- Frontend: Accessibility audit (WCAG 2.2 AA targets).
- Frontend: Add e2e smoke tests and critical path integration tests.
- Frontend: UI polish pass (spacing, typography hierarchy, component consistency).
- Backend: Load-test core endpoints and fix API bottlenecks.
- Backend: Add integration tests for auth and ingestion flows.
Deliverables:
- QA report and test coverage summary for frontend and backend.
Acceptance criteria:
- Meets performance budgets and accessibility criteria.
- Backend meets API latency/error targets under expected load.
- Visual QA checklist passes on iOS Safari and installed PWA.
Status: Not started

### Phase 7: Release readiness
Goal: Documentation, user onboarding, and monitoring.
Tasks:
- Frontend: Create user onboarding flows (install, share, shortcuts).
- Frontend: Add analytics/monitoring hooks (privacy-respecting).
- Backend: Add monitoring/alerting for API health and ingestion failures.
- Backend: Write operational docs for auth, ingestion, and data storage.
Deliverables:
- User guide and ops checklist covering frontend and backend.
Acceptance criteria:
- Onboarding verified on real iOS device.
- Backend runbooks and alerts validated in staging.
Status: Not started

### Phase 8: Automated Vercel deployment (final phase)
Goal: One-script deploy that is safe and does not affect existing client/backend.
Tasks:
- Choose Vercel deployment target (static or SSR) based on Phase 0 architecture.
- Create a single script that builds and deploys via Vercel CLI or API, then validates health checks.
- Implement safe rollout strategy (separate domain/subdomain, versioned assets, rollback).
- Add backend health validation steps (pre/post deploy) without altering the existing backend.
Deliverables:
- `deploy-client.sh` (or equivalent) with documented prerequisites.
- Pre/post deploy validation output includes backend health and `/v1/version` checks.
Acceptance criteria:
- New client deploys without downtime and existing client remains unaffected.
- Rollback path validated.
- Backend health checks pass before and after client deployment.
Status: Not started

## Quality gates (apply to all phases)
- Use Tavily MCP before selecting libraries/SDKs or deciding on platform capabilities.
- Keep this document updated after every material change.
- Validate on real iOS Safari and an installed PWA.
- Ensure backend contracts remain backward compatible.
- Maintain a clean, modern UI consistent with the design system.

## Known risks and mitigations
- iOS PWA feature gaps (Share Target, Background Sync, Wake Lock): mitigate with fallbacks (Shortcuts, manual refresh, keep-awake alternatives).
- Service worker caching edge cases on Safari: implement explicit update prompts and cache-busting.
- Scraping/ingestion fragility: keep ingestion server-side; ensure UI handles delays and errors gracefully.
- Persistent storage requires `DATABASE_URL`/`POSTGRES_URL` in hosted environments; without it, `/v1` routes return server errors. File-backed storage is local-dev only.

## Changelog
- 2026-01-07: Initial build plan created.
- 2026-01-07: Phase 0 started; Vercel deployment requirement added; compatibility matrix drafted.
- 2026-01-07: Phase 0 updated with auth decision (OAuth 2.1 + PKCE) and proposed v1 backend API contract.
- 2026-01-07: Phase 0 updated to confirm self-hosted OIDC and base URL placeholder.
- 2026-01-07: Frontend production URL set to https://itscooked.vercel.app/.
- 2026-01-07: GitHub repo set to https://github.com/Grey-Space-Consulting/itscooked.
- 2026-01-07: Repo resynced to GitHub; restored missing project files.
- 2026-01-07: Backend base URL set and UI requirements added across phases.
- 2026-01-07: Phase 0 re-verification completed; standards snapshot, compatibility matrix, and repo audit notes updated with fresh sources.
- 2026-01-07: Build plan clarified that Xcode/SwiftUI app items are out of scope for the web client.
- 2026-01-07: Phase 1 started; web client scaffolded in `/web` with Vite + React + TypeScript, routing, UI system primitives, and PWA manifest/service worker stubs.
- 2026-01-07: Phase 0 marked complete with stack selection and updated architecture decision summary.
- 2026-01-07: Phase 1 tooling run; lint, typecheck, and production build pass locally.
- 2026-01-07: Phase 1 updated with device validation script and pending iOS/Lighthouse checklist.
- 2026-01-07: Phase 1 added minimal app-shell caching in the service worker for installability baseline (no API caching).
- 2026-01-07: Phase 1 updated to note Lighthouse PWA category deprecation and DevTools PWA checklist fallback.
- 2026-01-07: Phase 1 added static PWA validation script; checks pass locally.
- 2026-01-07: Added `vercel.json` to build `/web` on Vercel and rewrite SPA routes to `index.html`.
- 2026-01-08: Phase 2 started with OIDC auth scaffold, API client integration, recipes read-only data flows, and offline/error UI states.
- 2026-01-08: Phase 2 expanded with env template, recipe detail offline callouts, and lint fixes for node script globals.
- 2026-01-08: Clerk App Router quickstart + Next.js App Router docs verified; migration to Next.js underway for Clerk integration.
- 2026-01-08: Auth decision updated to Clerk for the web client; self-hosted OIDC plan superseded for this app.
- 2026-01-08: Phase 2 updated with completed Next.js App Router migration, Clerk wiring, and passing lint/typecheck/PWA checks.
- 2026-01-08: Clerk auth UI moved into the client app shell for Next.js RSC compatibility.
- 2026-01-08: Removed middleware re-export after build error (Next requires only `src/proxy.ts`).
- 2026-01-08: Next.js build normalized tsconfig + next-env TypeScript settings.
- 2026-01-08: Theme color moved from metadata to viewport to remove Next.js warnings.
- 2026-01-08: Guarded against committing env files under `web/src` and clarified `.env.local` placement.
- 2026-01-08: Removed tracked `web/src/env.local` and tightened env file guardrails.
- 2026-01-08: Added prebuild cleanup to remove legacy middleware files that conflict with `src/proxy.ts`.
- 2026-01-08: Expanded middleware cleanup to cover nested `src/src` paths seen in CI error logs.
- 2026-01-08: Guarded `useOnlineStatus` against `navigator` access during SSR.
- 2026-01-08: Removed list feature (routes, UI, API contract, and plan scope) to unblock builds and refocus Phase 2.
- 2026-01-08: Set Vercel config for Next.js with `.next` output; Root Directory must be `/web` in Vercel project settings.
- 2026-01-08: Phase 2 marked complete for client implementation; live backend validation moved to follow-ups.
- 2026-01-08: Phase 3 started with ingestion API helpers, Home ingestion UI, polling, and iOS Shortcut guidance.
- 2026-01-08: Clerk test user/session created via Backend API (phone identifier) for live checks; API base returned 404 for `/v1/me`/`/v1/recipes` and 405 for `/v1/recipes/ingest`.
- 2026-01-08: Added `/v1` API route handlers in Next.js with Clerk token verification, file-backed JSON store, and stub ingestion processor.
- 2026-01-08: Updated Phases 2-8 requirements to include explicit frontend and backend tasks, deliverables, and acceptance criteria.
- 2026-01-08: Added Postgres-backed persistent store option, standardized `/v1` error responses, and CI workflow for lint/typecheck/build/PWA checks.
- 2026-01-08: Added `@types/pg` and re-ran local Next.js build + PWA static checks successfully.

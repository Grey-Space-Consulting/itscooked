# ItsCooked Web Client Build Plan (PWA for iOS)

Last updated: 2026-01-07
Owner: AI coding agent (Codex)
Status: Draft
Current phase: Phase 0 (in progress)
Next up: Complete Phase 0 (confirm backend base URL, finalize frontend stack)

## Non-negotiable rules (must follow every time)
1) Assume your knowledge is out of date. Before making any tech decision (framework, SDK, API, module), use the Tavily MCP to verify the latest guidance, support status, and versions. Record the sources and date in this document.
2) Keep this document current. After every change, phase progress, or decision, update this file with what changed, why, and what is next.
3) When a phase is complete, notify the user explicitly and mark the phase as Complete with the completion date.
4) The new client must not break the existing client or backend. Both clients must work concurrently against the same backend.
5) The final phase is a single automated Vercel deployment script that deploys this new client without affecting the existing client or backend.

## Scope summary
- Build a new web client (PWA) that runs well on iOS Safari and can be installed to Home Screen.
- Integrate with the existing backend. No breaking changes to current APIs.
- Deliver the ingestion, recipe management, and smart grocery list features described in the PRD.
- Maintain a reliable offline-first experience in grocery/cooking contexts.

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

## Current standards snapshot (must re-verify via Tavily in Phase 0)
- Web App Manifest: `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, `icons` (192/512 + maskable). Add iOS-specific metadata (`apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`). Verify current requirements before implementation.
- Service worker: use Cache API for app shell + critical data, and implement explicit update prompts to avoid stale caches in Safari.
- Web Push: historically supported on iOS 16.4+ only for installed PWAs; permission must be requested from within the PWA. Re-verify current Safari behavior.
- Web Share: `navigator.share()` is limited-availability; Web Share Target (`share_target`) is experimental and not Baseline per MDN. Treat iOS support as uncertain until verified; provide iOS Shortcut fallback if unsupported.
- Background Sync / Periodic Background Sync: likely Chromium-first; treat as unsupported on iOS unless verified. Use foreground sync + retry queues.
- Storage quotas: iOS Safari may enforce low storage limits; handle `QuotaExceededError` and provide cleanup paths.
- Wake Lock: support is uncertain on iOS; provide a fallback keep-awake strategy for cooking mode.

## Architecture guardrails
- Prefer standards-based web APIs with progressive enhancement.
- Avoid hard dependency on iOS-only behaviors; provide fallbacks for unsupported APIs.
- Favor stable, well-maintained libraries with clear release cadence.
- Use HTTPS everywhere; enforce security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy).
- Ensure the web client can be deployed independently from the existing client (separate domain or subdomain, separate build pipeline).

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
Status: In progress
Progress (2026-01-07):
- Repo appears to be an iOS SwiftUI template project; no backend endpoints or auth flows found.
- No existing API/base URL configuration detected in the repo.
- Tavily sources added for Web Share, Wake Lock, and Background Sync; compatibility matrix drafted below.
- Hosting decision: Vercel (prod). Custom domain TBD; use Vercel-provided URL until domain is set.
- Frontend URL (prod): https://itscooked.vercel.app/
- GitHub repo: https://github.com/Grey-Space-Consulting/itscooked
- Repo resynced to GitHub; project files restored after remote overwrite.
- Auth decision: OAuth 2.1 Authorization Code + PKCE (public client) with self-hosted OIDC on the existing backend. Refresh token rotation for public clients per RFC 9700.
- Proposed backend API contract drafted below (v1). All endpoints are additive and must not break the existing backend.
Blockers:
- Need backend base URL and confirmation of auth implementation constraints.

Compatibility matrix (iOS Safari/PWA, must re-verify each phase):
- Web Share API (`navigator.share`): Supported on iOS Safari 12.2+ per caniuse data. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-share.json
- Web Share Target (`share_target`): Experimental and not Baseline per MDN; iOS support unclear, treat as unsupported until verified. Source: https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
- Screen Wake Lock API: Supported on iOS Safari 16.4+ per caniuse data. Note caniuse bug indicates potential PWA-mode issues on iOS; verify on device. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/wake-lock.json
- Background Sync API: Not supported on iOS Safari per caniuse data. Source: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/background-sync.json
- Periodic Background Sync: No separate caniuse feature file; treat as unsupported on iOS Safari until verified. Source for API details: https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
- Web Push: Supported on iOS 16.4+ only for installed PWAs; must request permission within PWA. Sources: https://academy.insiderone.com/docs/web-push-support-for-mobile-safari, https://isala.me/blog/web-push-notifications-without-firebase/

Proposed backend API contract (v1, additive)
Base URL: `https://<backend-host>` (prod, TBD)
Auth/OIDC:
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
- PATCH `/v1/preferences` (units, aisle ordering, pantry defaults)

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

Grocery lists:
- POST `/v1/grocery-lists/preview` (body: recipe_ids, options)
- POST `/v1/grocery-lists` (persist a list)
- GET `/v1/grocery-lists/:id`
- PATCH `/v1/grocery-lists/:id`

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
Deliverables:
- Running web app shell with navigation and empty views.
- PWA manifest + service worker registration scaffold (no caching yet).
Acceptance criteria:
- App builds and runs locally on iOS Safari.
- Lighthouse PWA checks pass for baseline requirements.
Status: Not started

### Phase 2: Backend integration and auth
Goal: Connect to the existing backend safely.
Tasks:
- Implement API client and auth/session handling to match backend.
- Implement read-only data flows for recipes and lists.
- Add API error handling and offline-aware UI states.
Deliverables:
- Logged-in user can fetch recipe index and view details.
Acceptance criteria:
- No backend contract changes required.
- Existing client behavior remains unchanged.
Status: Not started

### Phase 3: Ingestion entry points
Goal: Users can add recipes via URL and iOS-friendly flow.
Tasks:
- Implement manual URL submission.
- Implement iOS Shortcut-based share flow (if Web Share Target is unsupported).
- Provide clear UX for “Queued / Processing / Ready / Error.”
Deliverables:
- URL ingestion flow with status updates.
- Shortcut instructions accessible in-app.
Acceptance criteria:
- User can add a recipe URL from iOS and see processing status.
Status: Not started

### Phase 4: Recipe view + edit
Goal: Display parsed recipes and allow edits.
Tasks:
- Build recipe detail view with ingredients and steps.
- Implement edit flow with validation and autosave.
- Add cooking mode with step-by-step UI and wake-lock fallback.
Deliverables:
- Full recipe detail experience including edits.
Acceptance criteria:
- Edits persist reliably and reflect backend state.
Status: Not started

### Phase 5: Smart grocery list
Goal: Provide merged grocery lists with unit conversion.
Tasks:
- Implement list generation and merging rules.
- Add unit conversion and fuzzy match threshold controls.
- Add “pantry” grouping for staple items.
Deliverables:
- Usable shopping list view with merged items.
Acceptance criteria:
- Duplicate ingredients merge correctly within defined thresholds.
Status: Not started

### Phase 6: Offline-first and PWA polish
Goal: Reliable offline usage and iOS install experience.
Tasks:
- Implement caching strategy (app shell + essential data).
- Add offline indicators and last-synced timestamps.
- Add update flow for service worker (prompt on new version).
Deliverables:
- App usable in low-connectivity environments.
Acceptance criteria:
- Works offline for recently viewed recipes and grocery lists.
Status: Not started

### Phase 7: Performance, accessibility, and QA
Goal: Ensure production quality.
Tasks:
- Run performance profiling and fix critical bottlenecks.
- Accessibility audit (WCAG 2.2 AA targets).
- Add e2e smoke tests and critical path integration tests.
Deliverables:
- QA report and test coverage summary.
Acceptance criteria:
- Meets performance budgets and accessibility criteria.
Status: Not started

### Phase 8: Release readiness
Goal: Documentation, user onboarding, and monitoring.
Tasks:
- Create user onboarding flows (install, share, shortcuts).
- Add analytics/monitoring hooks (privacy-respecting).
- Write operational docs for routine maintenance.
Deliverables:
- User guide and ops checklist.
Acceptance criteria:
- Onboarding verified on real iOS device.
Status: Not started

### Phase 9: Automated Vercel deployment (final phase)
Goal: One-script deploy that is safe and does not affect existing client/backend.
Tasks:
- Choose Vercel deployment target (static or SSR) based on Phase 0 architecture.
- Create a single script that builds and deploys via Vercel CLI or API, then validates health checks.
- Implement safe rollout strategy (separate domain/subdomain, versioned assets, rollback).
Deliverables:
- `deploy-client.sh` (or equivalent) with documented prerequisites.
Acceptance criteria:
- New client deploys without downtime and existing client remains unaffected.
- Rollback path validated.
Status: Not started

## Quality gates (apply to all phases)
- Use Tavily MCP before selecting libraries/SDKs or deciding on platform capabilities.
- Keep this document updated after every material change.
- Validate on real iOS Safari and an installed PWA.
- Ensure backend contracts remain backward compatible.

## Known risks and mitigations
- iOS PWA feature gaps (Share Target, Background Sync, Wake Lock): mitigate with fallbacks (Shortcuts, manual refresh, keep-awake alternatives).
- Service worker caching edge cases on Safari: implement explicit update prompts and cache-busting.
- Scraping/ingestion fragility: keep ingestion server-side; ensure UI handles delays and errors gracefully.

## Changelog
- 2026-01-07: Initial build plan created.
- 2026-01-07: Phase 0 started; Vercel deployment requirement added; compatibility matrix drafted.
- 2026-01-07: Phase 0 updated with auth decision (OAuth 2.1 + PKCE) and proposed v1 backend API contract.
- 2026-01-07: Phase 0 updated to confirm self-hosted OIDC and base URL placeholder.
- 2026-01-07: Frontend production URL set to https://itscooked.vercel.app/.
- 2026-01-07: GitHub repo set to https://github.com/Grey-Space-Consulting/itscooked.
- 2026-01-07: Repo resynced to GitHub; restored missing project files.

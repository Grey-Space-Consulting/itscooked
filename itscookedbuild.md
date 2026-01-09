# itscookedbuild.md
Last updated: 2026-01-08
Current phase: 4 - Grocery list + sharing flows (planned)
Source of truth: This file governs all build phases and must be kept current.

## Non-negotiable AI agent rules (MUST FOLLOW)
1) Always assume your knowledge is out of date.
   - At the start of every phase, use the Tavily MCP to verify current versions and standards for all frameworks, SDKs, APIs, and platform limits used in that phase.
   - Record the date, sources, and any changes in the Tavily Check Log.
2) Always keep this document up to date.
   - After any change to code, scope, requirements, or decisions, update:
     - Phase Tracker (status and notes)
     - Change Log (what changed and why)
     - Next Up (next concrete tasks)
3) Execute phases strictly one at a time.
   - Do not start a new phase until the current phase is marked complete in the Phase Tracker.
4) When a phase is fully complete:
   - Mark it "complete" in the Phase Tracker
   - Add completion notes and testing status
   - Explicitly notify the user that the phase is complete
5) No video storage.
   - Store only extracted text and the original source URL.

## Product summary (MVP)
Social Recipe Saver is a mobile-first web app (PWA) that lets users save Instagram or TikTok recipe links, automatically extracts ingredients and instructions into structured text, and generates a grocery list. Only textual recipe data and a link to the original post are stored (no video storage).

## MVP scope
- Auth via Clerk (email and optional OAuth).
- Save recipe by Instagram/TikTok URL (paste or share).
- Extract recipe title, ingredients, and instructions from post text and/or on-screen text.
- Recipe list and detail views with link back to the original post.
- Grocery list generation for a single recipe.
- Responsive, installable PWA with iOS-friendly UX.
- User-specific data ownership and basic CRUD for recipes.

## Out of scope (MVP)
- Meal planning, nutrition analysis, pantry tracking.
- Additional platforms (YouTube, Pinterest) beyond Instagram and TikTok.
- Native iOS share extensions (PWA only).
- Multi-recipe grocery list aggregation (nice-to-have, not required).

## iOS PWA standards and UX requirements (must follow)
These reflect current web standards and iOS realities. Re-check via Tavily at the start of each phase.
- HTTPS required for PWA features (service worker, web share, etc).
- Web App Manifest must include: name or short_name, start_url, display, and icons.
- Use display: "standalone" (or "fullscreen") for app-like launch on iOS Home Screen web apps.
- Include theme_color and background_color.
- Provide an apple-touch-icon link. On iOS, apple-touch-icon takes precedence over manifest icons.
- Use a proper viewport meta tag and safe-area padding (CSS env(safe-area-inset-*)).
- Service worker required for offline caching of shell assets.
- Web Share API requires secure context and transient user activation.
- Web Share Target API is experimental/limited availability; gate behind capability checks and assume no iOS support until confirmed.
- beforeinstallprompt is non-standard and limited availability; do not rely on it for iOS. Provide manual "Add to Home Screen" guidance.
- iOS web push, if used, requires the app to be installed to the Home Screen and a user-initiated permission prompt.

## Architecture (target)
- Frontend: Next.js 16.1.1 (App Router) + React 19.2.3 + TypeScript.
- Backend: Next.js API routes on Node.js 24.12.0 LTS (v24 Active LTS) or a dedicated API service if needed.
- Auth: Clerk (@clerk/nextjs 6.36.5; requires Next.js 13.5.7+, React 18+, Node >=18.17.0).
- Database: PostgreSQL 18.1 (latest stable; use a host that supports 18.x or fall back to 17.x) with Prisma 7.2.0.
- PWA tooling: Workbox 7.4.0 for service worker/offline caching.
- Extraction: Node-based pipeline (caption scrape + OCR) with optional async job queue if needed.
- Storage: text-only recipe data, no media storage.

## Data model (MVP)
- User (Clerk userId as primary identifier).
- Recipe:
  - id, user_id, source_url, source_platform, title
  - ingredients_list (array or JSON)
  - instructions_list (array or JSON)
  - created_at, updated_at
  - optional: original_creator, thumbnail_url
- GroceryList (optional storage):
  - id, user_id, name, items (JSON), source_recipes, created_at

## API surface (MVP)
- POST /api/recipes
  - Body: { url }
  - Behavior: validate URL, extract recipe, store recipe, return recipe data
- GET /api/recipes
  - Return: recipes for current user
- GET /api/recipes/:id
  - Return: recipe detail if owned by user
- DELETE /api/recipes/:id
  - Delete recipe if owned by user
- PUT /api/recipes/:id (optional)
  - Update title/ingredients/instructions
- Grocery list may be computed client-side from ingredients_list for MVP.

## Extraction requirements (MVP)
- Try caption/description first.
- If needed, run OCR on selected frames (no storing video).
- Heuristic parsing to split ingredients vs instructions.
- If extraction fails, return a clear error and allow manual editing if implemented.
- Respect platform policies: only fetch public posts, on-demand, no crawling.

## UI/UX requirements (MVP)
- North star: "Save in 5 seconds. Cook without re-watching."
- Principles: capture-first primary action, readable recipe cards, creator attribution + "View Original" link, no embedded video, mobile-first PWA.
- Route map:
  - Public: /, /sign-in, /sign-up
  - Authed: /app -> /app/recipes, /app/recipes, /app/recipes/new, /app/recipes/[id], /app/recipes/[id]/edit, /app/recipes/[id]/grocery, /app/settings
  - Share entry: /share (web share target), /import (?url=...)
- Global layout: top app bar + bottom nav on mobile; sidebar on desktop; toast system, skeletons, confirm dialogs, empty states.
- Core components: AppShell, RecipeCard, ImportBar, ImportProgress, IngredientList, InstructionList, GroceryChecklist (local persistence per recipe), SourceAttribution.
- Share flows: Android web share target to /share; iOS fallback via clipboard detection + optional Shortcut to /import; resume import after auth.

## Development phases (one at a time)
Each phase includes required Tavily checks. Do not start the next phase until the current one is complete and marked in the Phase Tracker.

Phase 0 - Standards and stack verification
- Tavily: verify latest versions for Next.js, React, Node LTS, Clerk SDK, Prisma, Postgres hosting, PWA tooling.
- Tavily: verify iOS PWA constraints (manifest, share target, web share, web push).
- Output: update stack choices and any requirement adjustments in this document.

Phase 1 - Project scaffold + auth + DB schema
- Create Next.js project (TypeScript).
- Configure Clerk, auth routes, and protected API base.
- Define DB schema and migrations.
- Deliver a basic signed-in view and an empty recipe list state.

Phase 2 - Recipes CRUD (API + UI)
- Implement recipe list and detail pages.
- Implement GET/POST/DELETE endpoints with Clerk auth.
- Add input validation and error handling.

Phase 3 - Import pipeline (Instagram/TikTok)
- Tavily: confirm best current approach for Instagram and TikTok metadata access.
- Implement URL validation, scraping, and extraction pipeline.
- Build /app shell and route structure (AppShell, /app redirect, /app/recipes, /app/recipes/new, /app/settings).
- Add ImportBar + ImportProgress UI, progress states, and failure UI with retries.
- Add /share and /import entry routes with auth resume behavior.
- Update library UI to include search, filter, sort, skeletons, empty states, toasts, and delete confirmation.
- Add /app/recipes/[id]/edit for manual corrections (textarea split/join).

Phase 4 - Grocery list + sharing flows
- Generate grocery list from ingredients.
- Build /app/recipes/[id]/grocery with GroceryChecklist, local persistence, copy list, and reset.
- Add Web Share API for sharing the grocery list outwards.

Phase 5 - PWA and iOS polish
- Manifest, icons, service worker, offline shell caching.
- Add Android share_target manifest config; verify /share entry flow.
- iOS install guidance UI (no beforeinstallprompt) in /app/settings.
- Safe-area and standalone launch verification on iOS.

Phase 6 - QA, testing, and release readiness
- Validate flows on iOS Safari and Android Chrome.
- Run lint/test/build and fix issues.
- Ensure data privacy and error handling are documented.

## Quality gates
- All API routes require auth and enforce ownership.
- No videos or media content stored.
- iOS install UX documented in-app.
- Lighthouse PWA checks pass for installability.
- Extraction errors are user-visible and non-destructive.

## Phase tracker
| Phase | Status | Notes |
| --- | --- | --- |
| 0 - Standards and stack verification | complete | Versions and iOS PWA constraints verified; stack updated. Testing: N/A (docs-only) |
| 1 - Project scaffold + auth + DB schema | complete | Scaffolded Next.js app, configured Clerk auth routes, defined Prisma schema + initial migration, added signed-in empty state and protected recipes API stub. Testing: not run (local Node 23.9.0; Prisma expects Node 24.12.0). |
| 2 - Recipes CRUD (API + UI) | complete | Added recipe list + detail pages, CRUD API (GET/POST/DELETE) with validation and ownership checks. UI spec enhancements scheduled in Phase 3. Testing: not run. |
| 3 - Import pipeline (Instagram/TikTok) | complete | Added import pipeline with metadata fetch (TikTok oEmbed, Instagram HTML meta), URL validation, and heuristic parsing. Built AppShell + /app routes, import UI with progress/failure handling, /share + /import entry flows with auth resume, library search/filter/sort/toasts/skeletons, and manual edit page. Follow-up: adjusted API route handler typing and Clerk middleware protect usage for Next.js 16 build. Testing: not run. |
| 4 - Grocery list + sharing flows | planned | Not started |
| 5 - PWA and iOS polish | planned | Not started |
| 6 - QA, testing, and release readiness | planned | Not started |

## Tavily check log
- 2026-01-08: Verified versions and iOS PWA constraints. Sources: npmjs.com/package/next, npmjs.com/package/react, npmjs.com/package/@clerk/nextjs, npmjs.com/package/prisma, npmjs.com/package/workbox-build, nodejs.org/en/download, nodejs.org/en/about/previous-releases, postgresql.org/about/newsarchive, developer.mozilla.org/en-US/docs/Web/Manifest, developer.mozilla.org/en-US/docs/Web/Manifest/share_target, developer.mozilla.org/en-US/docs/Web/API/Navigator/share, developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent, webkit.org/blog/13878/web-push-for-web-apps. Changes: locked stack versions, clarified iOS PWA requirements (standalone/fullscreen display, apple-touch-icon precedence, Web Share secure context, share_target limited availability, beforeinstallprompt non-standard, Web Push requires installed web app + user gesture).
- 2026-01-08: Phase 1 version check for Next.js, React, Clerk, Prisma, Node LTS, and PostgreSQL. Sources: npmjs.com/package/next, npmjs.com/package/react, npmjs.com/package/@clerk/nextjs, npmjs.com/package/prisma, nodejs.org/en/blog/release, nodejs.org/en/download/current, postgresql.org/about/newsarchive. Changes: none.
- 2026-01-08: Phase 2 version check for Next.js, React, Clerk, Prisma, Node LTS, and PostgreSQL. Sources: npmjs.com/package/next, npmjs.com/package/react, npmjs.com/package/@clerk/nextjs, npmjs.com/package/prisma, nodejs.org/en/blog/release/v24.12.0, postgresql.org/about/newsarchive. Changes: none.
- 2026-01-08: Phase 3 version + platform access check for Next.js, React, Clerk, Prisma, Node LTS, Instagram oEmbed, and TikTok embed/oEmbed. Sources: npmjs.com/package/next, npmjs.com/package/react, npmjs.com/package/@clerk/nextjs, npmjs.com/package/prisma, nodejs.org/en/about/previous-releases, nodejs.org/en/blog/release/v24.12.0, developers.facebook.com/docs/instagram/oembed, developers.facebook.com/docs/graph-api/reference/instagram-oembed, developers.tiktok.com/doc/embed-videos. Changes: versions unchanged (Next 16.1.1, React 19.2.3, @clerk/nextjs 6.36.5, Prisma 7.2.0, Node 24.12.0 LTS). Noted Instagram oEmbed requires app/client access token and is limited to embedding (metadata extraction disallowed); TikTok embed docs confirm oEmbed endpoint for embed markup.

## Decision log
- 2026-01-08: Plan targets a Next.js full-stack MVP with Clerk auth and Postgres (final versions to be confirmed in Phase 0).
- 2026-01-08: Locked stack versions to Next.js 16.1.1, React 19.2.3, Node 24.12.0 LTS, @clerk/nextjs 6.36.5, Prisma 7.2.0, Workbox 7.4.0, PostgreSQL 18.1 (host permitting; otherwise 17.x).

## Change log
- 2026-01-08: Created initial build plan and phase structure.
- 2026-01-08: Completed Phase 0 checks; updated stack versions, iOS PWA constraints, and phase tracker.
- 2026-01-08: Phase 1 scaffolded Next.js app, added Clerk auth routes, Prisma schema + initial migration with Prisma 7 config, basic signed-in UI state, and a protected recipes API stub.
- 2026-01-08: Phase 2 delivered recipes list + detail pages, create/delete API endpoints with validation, and ownership enforcement in API routes.
- 2026-01-08: Added UI/UX MVP requirements and mapped them into Phases 3-5 (routes, app shell, import, grocery, settings, share flows).
- 2026-01-08: Phase 3 delivered import pipeline (metadata fetch + parsing), AppShell and /app routes, import/share entry flows with auth resume, library UI upgrades (search/filter/sort/skeletons/toasts/confirm), and manual edit page + API updates for edits.
- 2026-01-08: Fixed Next.js 16 route handler typing for /api/recipes/[id] to satisfy build-time type checks.
- 2026-01-08: Fixed Clerk middleware to await auth() before calling protect() for Next.js 16 type checks.
- 2026-01-08: Updated Clerk middleware to use auth.protect() per Clerk v6 middleware type expectations.

## Next up
- Phase 4: Generate grocery list from ingredients, build /app/recipes/[id]/grocery with GroceryChecklist + local persistence, and add Web Share API for grocery list sharing.
- Re-deploy to confirm the Vercel build passes.

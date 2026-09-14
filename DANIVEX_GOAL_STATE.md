# DaniVex Goal State

## GOAL

Transform the existing platform and integrate the approved small 3D Companion;
preserve core functionality, validate and deploy to https://danivex.com.

## ARCHITECTURE

React 19 / Vite. HomePage owns sensitivity and home sections; PlayerScanner
owns /player-scanner and /cuenta/:uid.html. api/ owns server-only providers,
rights, cache and persistence. Existing react-icons, local fonts, real screenshots.
Add one lazy Three.js renderer, independent character asset adapter, state
controller and deterministic placement. Existing backend remains the authority.

## CURRENT_STATE

Initial commit 6cd21a0. Home, tools, Mobilador and social sections redesigned.
One lazy Three.js Companion with articulated reference-based placeholder;
state machine, safe placement, preference persistence and GLB adapter complete.
Vercel CLI session confirmed as daniespiritub; git origin main verified.

## COMPLETED

- Read supplied goal and reference; inspected routes, home logic, scanner entry,
  assets, styles, SEO and deployment metadata.
- Confirmed approved visual identity and existing tools/download destinations.
- Implemented shared responsive navigation, lazy PlayerScanner route, translated
  home components and genuine Mobilador release metadata/screenshot tabs.
- Preserved calculateSensitivity, devices dataset, APIs and visit counter.
- First desktop/mobile visual check; fixed React StrictMode WebGL context reuse.
- Finished responsive and interaction QA at 320/360/390/768/1024/1280/1440/1920px.
- Updated home metadata and sitemap; documented replaceable GLB pipeline.
- Fixed inherited scanner scroll container, guarded optional storage, deferred
  catalog failures and clipboard error feedback; API contracts remain unchanged.

## DECISIONS

- Use direct Three.js with lazy import, avoiding a second React scene framework.
- Preserve sensitivity calculations, device dataset, provider rules and APIs.
- Attempt reference-to-GLB conversion using the available Fal integration;
  asset quality and rigging must be verified before claiming a final model.
- Redesign using existing red identity, charcoal, warm yellow character detail,
  clear typography, flat tools layout and real Mobilador media.

## FILES_CHANGED

- PRODUCT.md, DESIGN.md, DANIVEX_GOAL_STATE.md
- package.json/lock (Three.js, test-only pngjs, compatible security updates), src/companion/*, src/components/home/*,
  src/components/SiteNav.jsx, src/data/ecosystem.js
- src/App.jsx, src/pages/{HomePage,PlayerScanner}.jsx, src/index.css,
  src/styles/home/*, src/styles/scanner/platform.css
- index.html, src/data/seo-meta.js, public/sitemap.xml, docs/COMPANION.md,
  tests/companion.test.js, scripts/qa-platform.mjs, .gitignore (.qa artifacts)

## TESTS

Baseline 209 tests; now 220/220 pass. ESLint passes. Production build passes.
Two browser QA rounds: 12/12 checks, no console/page/HTTP errors. Actual canvas
pixel comparison confirms colored geometry and motion. Android/iPhone/iPad/
Android tablets, massive catalog, manual fallback, DE/BR, ES/PT/EN and clipboard
preserve behavior. Exact scanner nickname and real images verified visually.
Mobilador EXE HEAD 200 (60,224,920 bytes); screenshot tabs and keyboard work.
Home JS 274.45 kB / 86.18 kB gzip; scanner lazy. Three renderer 618.69 kB /
157.14 kB gzip, deferred. GLTFLoader separate and unused without final asset.
Mechanical design scan: two layout-transition warnings corrected.

## KNOWN_ISSUES

- Catalog lazy chunk ~918 kB (existing).
- gh CLI not authenticated; Vercel CLI is authenticated and git remote works.
- Fal reference upload returned Forbidden. No final rigged character generated;
  temporary real 3D geometry used, not the supplied image floating on screen.
- npm audit fix applied compatible updates; npm audit now reports zero issues.
- Viewport/keyboard tests are browser emulation, not physical device testing.

## NEXT_ACTION

Commit verified implementation, push main, deploy through existing Vercel project
and run the same browser checks against public production without API fixtures.

## DEPLOY_STATUS

Existing production inspected. No new deployment yet.

## ACCEPTANCE_PENDING

Deployment and public verification. The temporary 3D model is explicitly allowed;
the final art asset remains replaceable without rebuilding the application.

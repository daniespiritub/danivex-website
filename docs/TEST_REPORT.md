# Test report

Baseline: 228 Node tests pass, build pass, initial JS 86.42 kB gzip. Baseline lint
had 18 errors in ignored third-party experiments; scope corrected, lint now passes.

Current local checks:
- 9 new security/API tests, including real PostgreSQL RLS execution and SDK PKCE.
- 48 UI fixture route/viewport checks: 360,390,430,768,1024,1440; no overflow or
  captured console/page exceptions. Sign-in/register/reset also tested at 360px.
- ES/EN/IT/PT account UI, settings submission and assistant consent toggles tested.
- Browser evidence in .qa/account-surface. Fixtures are isolated to Playwright;
  not deployed and not claimed as real Auth/AI integration tests.
- Build after new UI: initial entry 87.26 kB gzip plus shared JSX/icons chunk
  3.26 kB gzip; existing lazy catalog 215.04 kB and renderer 148.00 kB unchanged.
  No field CWV claim. Home catalog remains lazy.

## Clean release and real staging - 2026-09-20

Code commit: 1c1ad74399b0d95cb892b69d0a7a91c86c500a60, PR #39.
Clean checkout outside the original repository prevents the Vercel CLI from using
the parent workspace's uncommitted Companion experiments. Those remain untouched.

- 235 Node tests pass, zero failed/skipped. This count excludes three pre-existing
  uncommitted Companion tests and includes the new CSP regression test.
- Lint and production build pass. Tracked text/bundle scan: 216 files, no findings.
- Clean entry 87.23 kB gzip + shared JSX chunk 3.26 kB; lazy renderer 147.78 kB and
  device catalog 215.04 kB. The catalog is absent from initial browser requests.
- Preview dpl_6tF9MaErHb1HdfDTgX7wapFDqGZK built without cache and reached READY.
- scripts/qa-release.mjs: 12/12 real deployed checks, zero captured console/page
  errors, zero warnings. Six viewport widths: 360,390,430,768,1024,1440.
- Verified Android/iOS/tablet field visibility, iPad, curated/massive/manual devices,
  DE/BR distinct results, accents, ES/PT/EN, eye-only counter, private unavailable
  states, privacy, 14 page routes, real 404, sitemap, robots, cleanup workers.
- Real public Scanner returned the exact nickname for UID 2196518104; mobile and
  desktop images rendered. No account/AI fixture was used in this deployment test.
- Real 3D canvas pixels, texture colors, greeting movement and persistent minimize
  pass. Screenshots inspected at desktop/mobile; evidence .qa/staging-release-fixed.
- DAST smoke: CSP/HSTS/nosniff/frame denial, generic private API denial, cross-origin
  auth rejection (403), disabled assistant (503), private HTML noindex/no-store.

Initial staging exposed CSP blocking GLB blob texture fetches. Fixed connect-src
to permit local blob: resources, added regression coverage, and repeated staging.
The broken preview was never promoted. Automated browsers mark the visit session
as already counted, so QA does not inflate the public visitor counter.

Limitations: this is not a full penetration test or hosted Auth/AI acceptance.
Missing services remain disabled; production evidence is recorded after deployment.

## First production verification

PR #39 merged as ec1811b85f77f9f8eaead385cc3ce78cbd765e99. Vercel production
dpl_5CKcJrKsycnbSc4BQpSh7CVThzmb built without cache and was aliased to danivex.com.
The same 12/12 real browser checks pass on the domain with no console/page errors
or warnings (.qa/production-release). All gated capabilities remain false.

Both domain aliases point to this project. The config-only www redirect did not
take effect in live HTTP checks, so the project domain was also configured to
redirect to the apex (308). Verified /, /account/settings and Scanner with its UID
query all preserve the path/query. Public source-map URL returns 404. The actual
Mobilador release HEAD returns 200 (60,224,920 bytes). No installer was executed.

After main was scanned, three inherited CodeQL alerts appeared. Follow-up replaces
HTML tag filtering with parse5 (server-only) and substring URL classification with
parsed host/path checks, adds malformed-tag/Unicode/host-confusion regressions and
requires a new CI/CodeQL run and redeploy. These alerts were not ignored or dismissed.

## Private activation continuation, 2026-09-20

Base 436faa8. Separate clean worktree/branch; original dirty Companion experiments
left unchanged with tracked checkpoint fdb82561e50e3fae5b203db27c3081d9cf0935c0.
No Scanner, sensitivity, 3D asset/runtime or public layout changes in this phase.
Only App route registration adds /account/activity.

- Added transactional migration for lowercase handles, VEXA reservation, boolean
  availability RPC, timestamps, server-generated activity and live session RLS.
- Actual PostgreSQL/PGlite tests execute both migrations, two users and anon:
  owned persistence, read/insert/update/delete negatives, uniqueness, generated
  events, revoked-JWT denial and cascade account deletion.
- Supabase SDK with mocked transport verifies expired-token refresh/cookies,
  invalid/deleted/unverified users, outages, logout, global password-reset logout,
  signup/reset anti-enumeration, token confirmation, deletion authorization and
  handle rate limiting. These do not prove hosted Auth or email delivery.
- Browser fixtures: 54 route/viewport cases at 360/390/430/768/1024/1440, plus
  three anonymous forms, ES/EN/IT/PT, consent, availability, recovery, expiry and
  simulated BFCache lifecycle. No horizontal overflow or captured console errors.
- UI screenshots reviewed on mobile and desktop; impeccable detector returned no
  findings. Single-agent review, not an independent audit or penetration test.
- Hosted acceptance script exits NOT VERIFIED without required keys and documents
  its exact, restricted scope. No hosted migrations or live test accounts created.

Initial PR CodeQL identified three URL-substring checks in the new transport
fixtures; changed them to parsed exact-origin checks. A fourth trace classified
the test helper call `request('password', ...)` as returning a password, then
tainted the whole fixture (including IP/email) into the rate-limit HMAC. The
fixture now constructs its request separately from setting the password-action
URL. Production hashing is unchanged: the HMAC keys IP/email/UUID rate buckets,
never passwords. Passwords go only to Supabase Auth. No alert was suppressed.

Final commit/deployment/production results are recorded in
DANIVEX_PLATFORM_RELEASE_2026-09-20.md, delivered in the task workspace after
deployment. External configuration procedure: PRIVATE_PLATFORM_ACTIVATION.md.

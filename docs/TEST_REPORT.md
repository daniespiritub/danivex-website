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

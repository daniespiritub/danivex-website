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

Release verification, exact commit and deployment are appended after safe staging.

# Platform worklog

## 2026-09-19

- Read platform and autonomous-work briefs; inspected existing repository and APIs.
- Recorded baseline before implementation in docs/BASELINE.md and related audits.
- Created branch feat/account-platform-20260919; preserved existing dirty 3D work.
- Confirmed Vercel access and production project/domain; Supabase/AI credentials absent.
- Baseline: 228 tests pass; build pass; prod audit clean; lint includes experimental code.
- Architecture: isolated Supabase BFF, lazy private UI, fail-closed flags, real SQL RLS tests.

## 2026-09-20

- Implemented email/PKCE auth backend, profiles, favorites, saved sensitivity,
  requested downloads, support, chat opt-in/deletion and minimal activity.
- Executed actual migration in PGlite with A/B/anon; identity boundaries pass.
- Added real Responses API adapter with public sources and consent-bound counts tool;
  missing credentials keep it disabled, not replaced by simulated answers.
- Added lazy account/auth routes and ES/EN/IT/PT account text; preserved old tools.
- Added privacy page, noindex private HTML, CSP/security headers and error redaction.
- Added CI, CodeQL workflow and Dependabot configuration. Remote activation checked
  separately; a workflow file alone is not a successful security scan.
- 237 local Node tests pass (includes two uncommitted Companion tests from prior work).
- 48 responsive account route fixtures + 3 auth forms pass. Browser fixtures are not
  live integration proof. Build/lint/audit pass; secret/bundle scan no findings.
- Supabase/SMTP/Google/Apple/AI credentials remain external blockers to activation.

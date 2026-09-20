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
- 237 local Node tests pass (includes three uncommitted Companion tests from prior work).
- 48 responsive account route fixtures + 3 auth forms pass. Browser fixtures are not
  live integration proof. Build/lint/audit pass; secret/bundle scan no findings.
- Supabase/SMTP/Google/Apple/AI credentials remain external blockers to activation.
- Clean release worktree: 234 tests pass; only committed production-safe files included.
- First preview failed: unanchored Vercel ignore pattern removed src/assets. Corrected
  root-only exclusions and excluded generated dist; no production traffic affected.
- Moved clean publication checkout outside the original repo; Vercel otherwise
  walked up to the parent linked checkout and included uncommitted 3D experiments.
- Staging caught CSP blocking GLB blob textures; corrected the exact directive and
  added a regression test. 235 committed Node tests now pass.
- Real fixed staging: 12/12 release checks, six viewports, no captured browser errors;
  public Scanner real profile and Companion texture/motion pixels verified.
- GitHub CodeQL and CI run, open CodeQL alerts zero; enabled Dependabot alerts/fixes
  and main branch protection with required checks. PR #39 carries the release.
- Added a host-scoped www -> apex redirect: previously both hosts served HTTP 200,
  which would split account cookies and conflict with the exact auth origin.
- Merged PR #39, deployed ec1811b without cache, and passed 12/12 real production
  browser checks. Configured the project-level www 308 after HTTP checks showed
  the config-only rule had not taken effect; verified paths and query preservation.
- Default-branch CodeQL revealed three inherited alerts. Replaced HTML regex filters
  with parse5 and URL substring classification with parsed fields; added regressions.
  No alert was suppressed; follow-up CI and production revalidation required.

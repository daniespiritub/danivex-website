# Security test report - 2026-09-20

PASS locally:
- Real PostgreSQL (PGlite) executed the actual migration and policies, with distinct
  A/B/anon roles. Own reads, cross-owner inserts/deletes, anonymous reads, UUID/created
  timestamp grants, case-insensitive duplicate/reserved handles and cascade deletion.
- Chat opt-out deletes saved turns and rejects subsequent inserts.
- Consent required to attach support transcript.
- Exact origin/method/content type/body-size rejection, HttpOnly secure cookies,
  recent-auth rejection for old/recovery tokens, feature gates and generic errors.
- Actual Supabase SDK creates PKCE and persists independent verifier slots across
  server requests. Token exchange transport is mocked: this is NOT live OAuth.
- Assistant arbitrary tools/arguments and unconsented private queries rejected;
  outgoing test payload excludes account ID/email and uses store:false.
- npm audit: zero reported production/dev advisories at audit time.

BLOCKED by missing services: hosted JWT/refresh concurrency, email delivery and full
verification/reset, live Google/Apple, real Supabase A/B/RLS via PostgREST, live AI
adversarial tests, backup restore. No production user records or real accounts were
created. These features remain disabled until those gates pass.

The report is not a pentest certification. Production header/smoke evidence is
recorded separately in TEST_REPORT.md after deployment.

## GitHub and real staging

- GitHub CodeQL completed successfully; the initial alerts query returned [] before
  the default branch analysis. This did not prove the absence of inherited findings.
- Secret scanning and push protection already enabled and retained.
- Enabled vulnerability alerts and Dependabot security updates (verified enabled).
- Protected main: require verify/analyze from the GitHub Actions app, up-to-date
  branch, resolve conversations, apply to admins, prohibit force pushes/deletion.
  PRs required with zero external approvals because this is a single-owner workflow;
  automated checks are not presented as an independent human security review.
- Preview access protection remains enabled; Playwright uses the official project
  automation bypass in-memory on same-origin requests only. No credential in Git.
- Staging policy preserves embedded GLB texture fetches with connect-src blob:;
  external API destinations and arbitrary external scripts remain denied.

Configuration references: [GitHub protected branches](https://docs.github.com/en/rest/branches/branch-protection),
[CSP connect-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src).

## Default-branch findings and remediation

The subsequent main analysis reported three high-severity CodeQL findings in
pre-existing public profile code: two incomplete HTML tag filtering expressions
and one substring-based URL classification. The text is consumed as data, not an
HTML sanitization boundary, but these patterns are corrected rather than waived.

- api/_lib/providers/text-utils.js now parses HTML with parse5 and walks text nodes,
  omitting script/style/template content even with unusual valid closing tags.
- api/free-fire-prime.js reuses that parser, removing its duplicate tag filters.
- api/_lib/profile-images.js compares parsed protocol/hostname/origin/path, not a
  hostname embedded anywhere in the URL. Tests include userinfo and hostile suffixes.
- Added three focused tests; all existing profile/Prime tests continue to pass.
  The parser runs only on the server and adds no browser bundle weight.
- Follow-up PR/CodeQL and live redeploy must confirm closure. Workflow success alone
  is not used as evidence that alerts are resolved.

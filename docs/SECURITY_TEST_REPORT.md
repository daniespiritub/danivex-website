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

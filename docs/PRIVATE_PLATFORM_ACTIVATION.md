# Private platform activation

Status on 2026-09-20: READY EXCEPT EXTERNAL CREDENTIALS. Account and assistant
remain disabled. Local transport fixtures and PostgreSQL tests are not hosted
acceptance. Do not enable production before the external checks below pass.

## Required Configuration

All Vercel values are **SERVER ONLY**, including the public Supabase key in this
BFF architecture. Nothing needs a `VITE_` prefix. Do not paste secrets in Git,
screenshots, reports or chat. Configure a separate Supabase project for preview.

| Service / location | Field | Required value / purpose |
| --- | --- | --- |
| Supabase Dashboard > Project Settings > API | Project URL | Actual project URL, copied as `SUPABASE_URL` into Vercel > danivex-website > Settings > Environment Variables. None currently available. |
| Supabase > Project Settings > API Keys | Publishable or legacy anon key | `SUPABASE_ANON_KEY`; server client authenticates with the user's scoped JWT, not admin access. |
| Supabase > Project Settings > API Keys | Service role key | `SUPABASE_SERVICE_ROLE_KEY`; trusted backend deletion only. The live acceptance script uses it to create/delete its own disposable users. |
| Vercel > Environment Variables | `RATE_LIMIT_SECRET` | Cryptographically random value of at least 32 characters, unique per environment. Generate after provisioning; not an external credential. |
| Vercel > Environment Variables | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Existing Upstash connection is present; verify least privilege/availability. Fail-closed limits require these plus the secret. |
| Vercel > Environment Variables | `APP_ORIGIN` | Production: `https://danivex.com`. Preview: its exact approved HTTPS origin. Local development: `http://127.0.0.1:5174`, never in production. |
| Supabase > Authentication > Email / SMTP Settings | Host, port, username, password, sender email and sender name | Values from an authorized SMTP provider and a verified sender domain. No SMTP password belongs in frontend/Vercel when Supabase sends email. Configure the provider's exact SPF/DKIM records without replacing unrelated DNS. |
| Google Cloud Console > Google Auth Platform > Clients > Web application | Client ID + client secret | Set in Supabase > Authentication > Sign In / Providers > Google. Obtain callback from that project, as described below. |
| Apple Developer > Certificates, Identifiers & Profiles | Services ID, Team ID, Key ID, `.p8` signing key; generated client secret | Configure Sign in with Apple for the web and set credentials in Supabase > Providers > Apple. Protect key; record the generated secret's expiry and rotation owner. |
| OpenAI Platform > API keys | Project API key | `OPENAI_API_KEY` in Vercel. Separate project with spend limits. |
| OpenAI project | Authorized model ID | `OPENAI_MODEL`; use a currently available Responses/function-calling model and verify it in that project. No invented/default model. |

Flags remain `ACCOUNT_ENABLED=false`, `ASSISTANT_ENABLED=false`,
`AUTH_GOOGLE_ENABLED=false`, `AUTH_APPLE_ENABLED=false`, `AUTH_LINKING_ENABLED=false`
until their respective preview checks pass. `ASSISTANT_DAILY_LIMIT=200` defaults
to a fail-closed call budget, not a monetary guarantee; configure provider spend limits.

## URLs And Email

Supabase > Authentication > URL Configuration:

- Site URL: `https://danivex.com`.
- Allowed redirect: `https://danivex.com/auth/confirm`.
- PKCE callback: `https://danivex.com/api/auth?**` (query wildcard only, not host).
- Preview and local callbacks belong in the separate nonproduction project.

Google authorized redirect URI / Apple Return URL is the **actual Supabase Auth
callback shown in that project's provider panel**, normally
`https://<actual-project-ref>.supabase.co/auth/v1/callback`. This is a template,
not an existing URL. It cannot be completed before the project exists. Do not
use the DaniVex BFF callback as the Google/Apple provider callback. The second
redirect is Supabase -> DaniVex BFF with PKCE flow ID.

Authentication settings: confirm email ON, minimum password length 12, secure
email change ON (both addresses), provider rate limits, security notifications.
Email templates (disable tracking/link rewriting at the email provider):

```html
<!-- Confirm signup -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=signup">Confirm account</a>
<!-- Password recovery -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
<!-- Email change -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email_change">Confirm email</a>
```

Verification is a user-initiated POST; visiting a link does not consume it. The
browser removes its query string. Signup/reset always return generic messages
to resist enumeration; that response alone does not prove delivery. Default
Supabase SMTP is not a production delivery solution for arbitrary addresses.

## Database And Backup Gate

Apply these migrations in order using the authorized Supabase migration workflow:

1. `supabase/migrations/202609190001_accounts.sql`
2. `supabase/migrations/202609200001_private_activation.sql`

Record backup/PITR plan, retention, RPO/RTO and a tested restore to an isolated
project before modifying a production DB. Neither migration has been applied
remotely in this release: no project credentials exist. Do not invent backup success.

Migration 2 lowercases existing handles without changing UUID ownership. The
existing lowercase unique column prevents new collisions. An existing `vexa`
handle aborts the transaction for owner-reviewed resolution, never silent deletion.
Updated timestamps are DB-owned. Historical account-created events are not
backfilled; new events reflect actual changes only. Download events mean request,
not completed transfer, installation or entitlement. Direct saved-item UPDATE
is deliberately not granted; cross-user modification is denied for both users.

`dv_session_active()` reads only the caller's `auth.sessions` identity from a
verified JWT. Fixed search path, no supplied UUID, authenticated execution only.
RLS and BFF require it so logout/revocation deny a still-unexpired JWT. Auth and
profile checks fail closed during outage. Password changes revoke all sessions;
if revocation fails, browser cookies are cleared but the API reports failure.
Profile/availability access needs email verification at the BFF. The database
never grants access to another user's rows. Activity insertion is trigger-only.

## Acceptance Procedure

1. In preview, configure real services, migrations and flags for testing. Keep
   production flags false. Do not share preview credentials with Scanner or AI.
2. `node --env-file=<secure-env-path> scripts/verify-live-accounts.mjs` checks
   required variables without displaying values. Exit 2 means NOT VERIFIED.
3. `node --env-file=<secure-env-path> scripts/verify-live-accounts.mjs --execute`
   creates two disposable admin-confirmed users in the approved staging project,
   tests actual hosted Auth/PostgREST/RLS/refresh/revocation and removes them in
   `finally`. It inserts controlled test histories, never production statistics.
   Verify cleanup report. This is **not** a test of email delivery or browser E2E.
4. With two controlled mailboxes, complete actual browser signup, incoming email,
   explicit confirmation, lowercase handle selection, duplicate/reserved denial,
   favorites/save/download request persistence after reload, activity and deletion.
5. Password reset: request -> receive -> confirm -> new password -> sign in again.
   Verify old password fails and old sessions cannot query rows or BFF endpoints.
   Test logout, refresh rotation, expiry, deleted user, provider outage and Back.
6. Google and Apple: real desktop and mobile redirects, cancellation, invalid
   callback, new profile/onboarding, returning account, explicit recent-auth linking.
   Supabase manages verified identity linking; never merge by an email string.
   Apple private relay may require explicit linking rather than automatic matching.
7. OpenAI: public/unknown questions, VEXA unavailable status, explicit own-count
   consent, no-consent refusal, foreign UUID/tool injection, long input, provider
   failure and rate/spend caps. Inspect network: browser only talks to same-origin
   BFF; no service keys. History remains optional, per-user, deletable and not replayed.
8. Run `npm run lint`, `npm test`, `npm audit --omit=dev`, `npm run build`,
   `node scripts/security-scan.mjs`, `node scripts/qa-account.mjs --start`.
   The browser fixture suite is UI evidence only, not real Auth/OAuth/AI proof.
9. Promote only after live evidence, then repeat flows on danivex.com. The existing
   `qa-release.mjs` intentionally expects disabled capabilities; update that gate
   in the activation commit and retain all public regression checks.

## Rollback

Known good base: `436faa826a3b643425ac29a149d751115b42596f` and Vercel deployment
`dpl_FBKHZruSXnniGFztk8av37kbQdgj` (existing verified public site).
Use Vercel rollback if this release regresses public functionality. For private
activation failures disable relevant flags and redeploy. Application rollback
does not reverse DB changes. Do not drop user tables or revert RLS automatically.

## Sources

- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase signOut](https://supabase.com/docs/reference/javascript/auth-signout)
- [Production SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)

# Auth architecture and activation

## Current status

Implementation and local tests exist. Hosted Supabase, SMTP and OAuth credentials
are absent in both local and Vercel configuration. Registration is NOT live-tested
and remains hidden. No migration has been applied to a remote database.

## Server boundary

The same-origin BFF stores access/refresh tokens in `__Host-dv-*` cookies:
HttpOnly, Secure, SameSite=Lax, Path=/, no Domain. Local HTTP is allowed only outside
production. Tokens never appear in JSON responses or browser storage. SDK instance
is per request; getUser validates the token before private access. Session refresh
writes rotated cookies. API responses are private/no-store and not wildcard CORS.

Mutation requests require the exact APP_ORIGIN and JSON content type. OAuth uses
Supabase PKCE; verifier slots/index are in ten-minute HttpOnly cookies. SDK's explicit
flow-ID redirect option is enabled and regression-tested. Callback redirects only to
/account or a fixed sign-in error route. No arbitrary `next` URL is accepted.

Profile UUID comes from auth.users. Handle is 3-16 ASCII letters/numbers/underscore;
generated lowercase unique column and reserved-name check enforce DB integrity.
App never merges users by email. Supabase's own verified identity linking applies.
Private endpoints require confirmed email. Sensitive changes require a validated
JWT AMR password/OAuth/TOTP event within five minutes. Recovery/OTP may change a
password but cannot authorize account deletion or email change.

## Required activation sequence

1. Create/authorize a Supabase project, decide region/retention and enable backups.
2. Apply the migration to an empty staging project first. Run live A/B/anonymous
   tests through actual Supabase Auth and PostgREST before production activation.
3. Configure server-only SUPABASE_URL and SUPABASE_ANON_KEY. Service-role key is
   optional for deletion, used ONLY by the explicit recent-auth deletion path.
4. Generate RATE_LIMIT_SECRET with at least 32 random characters. Configure Redis
   server credentials and APP_ORIGIN exactly (separate staging origin/project).
5. Configure SMTP, confirm-email enabled, minimum password length 12, secure email
   change requiring both addresses, provider rate limits and notifications.
6. Set Site URL https://danivex.com; allow /auth/confirm and
   https://danivex.com/api/auth?** for PKCE query parameters. No wildcard host.
7. Email templates must point at the confirmation page (not implicit JWT fragments):
   signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
   reset: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
   change email: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change`
   Disable email link tracking. Confirmation is an explicit user POST, not a GET.
8. Test verified signup/login/logout/refresh/reset/change-email, unique handles and
   deletion with two controlled accounts. Then ACCOUNT_ENABLED=true and redeploy.

References: [Supabase cookie guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide),
[email templates](https://supabase.com/docs/guides/auth/auth-email-templates),
[identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking).

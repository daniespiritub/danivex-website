# Architecture draft

## Decision

Preserve React/Vite/Vercel. Add a lazy account surface and a same-origin backend
for frontend (BFF). Choose Supabase Auth + PostgreSQL rather than building password
storage or pretending the existing Redis cache is an account database.

Identity is the Supabase UUID, never email. Official identity linking only. All
private tables use RLS and explicit column grants. Production Supabase is not yet
configured; actual SQL policies will be executed locally using PGlite PostgreSQL
under A/B/anonymous roles. This does not replace hosted Auth/OAuth integration tests.

Auth tokens remain in HttpOnly cookies, not browser localStorage. PKCE is handled
server-side. Private REST queries use the user's JWT, never a service-role bypass.
Administrative credential is restricted to explicit account deletion only.

Assistant uses curated public knowledge and a closed minimal tool allowlist, with
server authorization independent of prompts. No arbitrary SQL, shell, URLs or
private Scanner-provider bridge. Chat retention is opt-in; no automatic full history.

## Release gates

Credentials and readiness flags gate auth, OAuth and assistant independently. Missing
services are hidden from public navigation, not presented as working. A safe release
may therefore be PARTIAL, not a completed user platform. Preserve original production
deployment for rollback. No destructive database migration or hosting migration.

## Sources

- https://supabase.com/docs/guides/auth/server-side/advanced-guide
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://pglite.dev/docs/api
- https://developers.openai.com/api/docs/guides/function-calling

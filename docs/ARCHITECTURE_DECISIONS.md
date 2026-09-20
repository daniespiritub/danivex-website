# Architecture decisions - 2026-09-20

1. Keep React/Vite/Vercel. An auth feature does not justify a full Next migration.
2. Supabase Auth and PostgreSQL instead of custom passwords or Redis account storage.
   UUID is canonical; official linking handles identities, no email-based app merge.
3. BFF uses HttpOnly cookies. No browser Supabase SDK, JWT localStorage or service key.
   RLS still applies because private queries use each user's bearer, not an admin key.
4. Private tables in public schema have RLS, restricted grants and no anon access.
   No security-definer data-reading RPCs. Auth-owned profile creation has fixed search_path.
5. New UI is lazy-loaded, ES/EN/IT/PT. Existing home translations and rules unchanged.
6. AI uses Responses API with store:false, bounded public retrieval and one read-only
   tool returning counts, only with explicit consent and server-bound identity.
7. Missing credentials are release blockers, not reasons to fabricate working services.
   No new service purchase, account creation or production database mutation occurred.
8. Preserve pre-existing experimental Companion work outside these commits/deployment.

Alternatives rejected: storing password hashes ourselves, private data in public FF
cache, browser-side service role, full site redesign, scraped private Free Fire data,
fake answers/history, broad autonomous SQL tools and exposing unconfigured OAuth.

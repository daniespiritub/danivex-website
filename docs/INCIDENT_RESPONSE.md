# Incident response

1. Disable ACCOUNT_ENABLED / ASSISTANT_ENABLED as appropriate and redeploy. Preserve
   request IDs, timestamps and sanitized provider logs; do not copy tokens to tickets.
2. If public regression exists, roll back to the prior Ready Vercel deployment.
3. Rotate affected Supabase service credentials, AI/Redis keys and OAuth secrets at
   source; update Vercel environments. Revoke affected sessions using provider tools.
4. Establish scope: records touched, RLS policy changes, deploy SHA and access logs.
   Restore a backup into an isolated project before any overwrite of live data.
5. Notify affected parties following applicable obligations after facts are verified.
6. Add a regression test, verify staging A/B isolation and perform a reviewed release.

No automatic destructive remediation, database wipe or unauthorized provider testing.

# Security baseline

2026-09-19; before implementation. No account system currently exposed.

1. Missing application CSP, nosniff, frame and referrer headers. HSTS already served
   by Vercel. Add conservative policy and verify 3D worker/WASM and Scanner images.
2. `api/visits.js` and legacy Prime errors expose exception messages. Replace with
   stable public codes; never publish token/provider internals.
3. Existing public rate limiter fails open; unsuitable for auth or paid AI.
4. Public API wildcard CORS must NOT be copied to account endpoints.
5. `.env.production` is not universally ignored; expand ignore before new secrets.
6. Existing persistent public UID observations require accurate privacy disclosure.
7. No private DB, RLS, identity controls, deletion flow or production OAuth setup.
8. No production dependency advisory reported by npm audit. No claim of pentest.
9. Local experiment folders must be excluded from lint and deployment explicitly.

New private endpoints require strict same-origin JSON mutations, HttpOnly secure
cookies, authoritative user lookup, row ownership in both BFF and PostgreSQL,
no-store responses, generic errors, request/time limits and fail-closed rate limits.

Reference: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

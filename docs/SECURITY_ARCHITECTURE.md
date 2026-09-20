# Security architecture

- Private tables: forced RLS, no anon grants; owner policies for reads/deletes,
  restricted inserts and update columns. Auth UUID cannot be supplied on insertion.
- BFF: authoritative getUser, exact-origin JSON mutations, no arbitrary redirects,
  no-store responses, request size bounds, action/table allowlists and generic errors.
- Cookies: HttpOnly/Secure/SameSite, __Host prefix on HTTPS. No third-party scripts.
- Rate limits: Redis atomic counter+TTL, HMAC IP/email/UUID keys, fail closed, bounded
  request timeout. AI also has per-user and global daily request caps. Provider-side
  spend caps remain required; request caps are not a currency spending guarantee.
- Sensitive operations: five-minute validated AMR. Admin service role only deletes
  the current authorized UUID after explicit DELETE confirmation.
- Client: React escaping, no model HTML rendering, no arbitrary AI tool arguments.
- Headers: CSP, nosniff, DENY framing, no-referrer, restricted Permissions-Policy.
  CSP permits local WASM/worker blobs for Three.js and explicit Scanner image hosts.
  Inline styles remain necessary for the existing React interface. No unsafe-inline JS.
- No custom admin portal or privileged model tools. Any future admin must require MFA.
- Sanitized operational errors contain request ID/code only, not body/email/token.

Remaining gates: hosted JWT/session tests, SMTP/provider configuration, production
RLS validation, retention/backups review, CAPTCHA decision based on abuse, independent
penetration test. Existing public Scanner limiter still fails open and is isolated.
No assertion of complete OWASP compliance or zero vulnerabilities is made.

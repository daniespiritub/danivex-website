# Threat model

| Threat | Implemented control | Remaining verification |
| --- | --- | --- |
| IDOR / cross-account reads | validated UUID + SQL RLS + narrow grants | actual hosted A/B sessions |
| CSRF / login CSRF | exact Origin, JSON, Lax cookies, PKCE verifier | hosted OAuth and email flows |
| XSS / malicious model answer | React text rendering, CSP, no model HTML | independent DAST |
| Prompt injection / exfiltration | no arbitrary tools, counts only, consent, bound identity | live model adversarial eval |
| Credential leak | server env, bundle scan, no client SDK tokens | provider rotation procedures |
| Bruteforce / AI cost | HMAC rate keys, fail closed, global budget | provider spending limits/CAPTCHA |
| Duplicate / reserved handle | DB generated normalized unique value + check | hosted migration confirmation |
| Forged account deletion | recent verified AMR + typed confirmation + current UUID | hosted deletion/cascade test |
| Dependency compromise | lockfile, npm audit, CI, Dependabot, CodeQL workflow | review advisories continuously |
| Third-party outage | isolated endpoints, timeouts, unavailable state | production provider failure drills |
| Stale / unsupported product advice | curated source registry, no fabricated releases | review docs on each release |

Trusted boundaries: Vercel environment, Supabase Auth signature validation,
PostgreSQL role enforcement, owner/admin accounts. A compromise of a hosting or
service-role credential is outside RLS's protection and requires rotation/recovery.

# Third-party API audit

Audit date: 2026-09-19. Classification concerns this integration, not an endorsement.

| Integration / files | Data sent | Authentication | Classification / action |
| --- | --- | --- | --- |
| SiamBhau `/freefireinfo/bhau`, `/freefireinfo/stats`; `api/_lib/providers/siambhau.js` | Public UID, region, mode | Server API key in provider query | REVIEW: unofficial, retention/licensing unverified. Preserve for existing Scanner, never send account data. |
| FreeFireMania `/cuenta/{uid}.html`; provider and passes parsers | Public UID | None | REVIEW: scraping availability/terms risk; bounded timeout and fallback. |
| FreeFireJornal public player pages / Prime article | Public UID | None | REVIEW: secondary public source, do not treat estimates as private authoritative data. |
| jsDelivr `ShahGCreator/icon/PNG`; image resolvers | Item ID; browser IP/referrer | None | REVIEW: remote image provenance/availability; restrictive referrer policy. |
| Garena rank images in `public/ff-emblems` | No runtime request for local files | None | SAFE as local delivery; preserve attribution/license records. |
| Upstash Redis; `api/_lib/private-db.js`, rate limits, visits | Public UID observations, counters; legacy IP rate-limit keys | Server encrypted environment | REVIEW: public-data cache, despite filename NOT a private account DB. Existing limiter fails open. New auth/AI limiter must fail closed. |
| GitHub Mobilador release / `src/data/ecosystem.js` | User-requested download; provider sees network metadata | Public | SAFE for current public release; no fabricated download completion. |
| Discord/WhatsApp/Instagram/TikTok | Only when user follows link | User provider session | SAFE outbound links, not embedded trackers. |
| Supabase (new, inactive until configured) | Email/auth credentials, private owned records | Server BFF + scoped user JWT | REVIEW pending project, SMTP, retention and live RLS validation. Never accessible to Scanner providers. |
| OpenAI (new, inactive until configured) | User-entered message, curated public docs, explicitly requested minimal own summary | Server API key | REVIEW pending activation, budget and privacy approval; store:false does not promise zero provider retention. |

Registry/research URLs do not imply active integrations. No advertising script was
observed in the active HTML. Legacy SW cleanup is intentionally retained.

Sources: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[OpenAI data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint).

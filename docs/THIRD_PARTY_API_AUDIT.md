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

## Private Activation Review, 2026-09-20

Read-only review of existing public adapters; no Scanner provider code changed.

| Provider | Endpoint / execution | Returned data | Boundary / remaining risk |
| --- | --- | --- | --- |
| SiamBhau | `https://siambhau69.eu.cc/freefireinfo/bhau`, `/freefireinfo/stats`; backend | Public profile/rank/stat fields | Provider sees public UID/region and its own key only. Unofficial availability and retention remain external risks. |
| FreeFireMania | `https://www.freefiremania.com.br/cuenta/{uid}.html`; backend | Parsed public profile/pass HTML | No Supabase/OpenAI credential, cookie or private record is forwarded. Scraping may fail/change. |
| FreeFireJornal | `https://freefirejornal.com/es/perfil-jogador-freefire/{uid}/` and the existing Prime article; backend | Public page data, not authenticated inventory | Bounded requests; no private-user identity. |
| jsDelivr / approved image hosts | Existing item PNG URLs; browser | Images | Browser network metadata exposed to image host; no account records, credentials or user JWT. Local assets make no provider call. |
| GitHub Releases | `https://github.com/daniespiritub/danivex-mobilador/releases/download/v0.0.0.1/DaniVex-Mobilador-Setup.exe`; requested browser navigation | Existing public installer | Request recorded locally, never fictional completion. Provider receives no private account fields. |
| Upstash | Configured Redis REST URL; backend | Cache values/rate-limit counts | Existing public cache is separate from Supabase records. New rate limits store HMAC identifiers, no raw email/password. |
| Supabase | Actual project URL pending: `/auth/v1`, `/rest/v1`; backend | Auth sessions and scoped own rows | Only intended identity/database processor; RLS, verified identity, live session gate. Third-party public providers cannot access its credentials. |
| SMTP | Authorized provider configured in Supabase, not present | Delivery outcomes | Receives only transactional mail/recipient content. No favorites/download/chat history. Delivery/retention need real configuration. |
| Google / Apple | Supabase-managed OAuth redirect; provider credentials pending | Verified identity claims to Supabase | DaniVex never merges by untrusted email; explicit linking requires recent auth. No private application tables sent. |
| OpenAI | `https://api.openai.com/v1/responses`; backend, inactive | Assistant text or closed tool call | Only message, public docs and explicitly consented own counts. No UUID, email, cookies, IP, stored conversations, favorites or download lists in provider payload. `store:false` is not zero retention. |

No new analytics or advertising provider was introduced. References in historical
documentation are not live integrations. Real provider credentials, delivery,
identity linking and model behavior remain NOT VERIFIED until activation.

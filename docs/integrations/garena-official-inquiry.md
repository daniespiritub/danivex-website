# Garena / Free Fire — Official Integration Inquiry

Record of DaniVex's informational request to Garena for an **official, authorized**
Free Fire player-data integration. No secrets are stored here (no passwords, cookies,
tokens, or session data).

## Status

| Field | Value |
|---|---|
| `status` | **contacted / pending** |
| `contactDate` | 2026-09-13 |
| `channel` | Official Garena Free Fire Support (EU) — Zendesk ticket portal |
| `channelUrl` | https://support-freefiresg.garena.com/europe/tickets |
| `ticketId` | **835889** |
| `ticketUrl` | https://support-freefiresg.garena.com/europe/my-tickets/835889 |
| `requestType` | Game Concerns → Question/Feedback/Suggestion (asked to route to Developer Relations / API / Partnerships / Technical Integration) |
| `lastStatus` | OPEN (created 2026-09-13 05:43 AM) |
| `submittedBy` | Signed-in Free Fire/EU account (region EUROPE); contact email judaesbravo5@gmail.com |

## Why this channel

Garena has **no public developer/partner API** for Free Fire player data and **no
dedicated business/developer contact form**. The official Zendesk help-center hosts
(`ffsupport.garena.com`, `ffsupporteu.garena.com`) returned Cloudflare **Error 1034
(Edge IP Restricted)** — a server-side routing block, not a captcha. The working
official route is the per-game support portal reached from garena corporate
(`garena.sg/support` → `support-freefiresg.garena.com`, auto-routed to `/europe`).
One ticket only — no duplicates/spam.

## What we asked

- Whether a public / developer / partner / business / read-only player-profile API
  exists, and how DaniVex could request access.
- **Historical Elite Pass / Booyah Pass ownership by UID** (seasons participated,
  passes purchased, badges).
- **Official Prime level 1–8 badge/icon mappings and assets.**
- Approved asset API / CDN / item catalog / media kit for rank emblems, Prime badges,
  pet/item icons, banners, pass images — and the required attribution/copyright notice.
- Auth requirements, global vs regional availability, region-from-UID, rate limits,
  caching/data-retention, attribution, commercial/non-commercial conditions.
- To route the request to the correct Developer Relations / API / Partnerships /
  Technical Integration team if support is not the right team.

We explicitly stated we are **not** requesting private/internal endpoints, auth
bypasses, private tokens, credentials, or restricted systems — the opposite: a
documented, authorized integration that respects Garena ToS, copyright, privacy,
rate limits and attribution. DaniVex was presented honestly as an independent web
project (not an affiliate/partner).

## Constraints honored

No payment, no plan/subscription, no NDA, no special commercial/legal agreement, no
account-security changes. Only a standard Privacy-Policy acknowledgment on the support
form. Login was via the existing Google session (no password entered by the tool).

## Next steps

- Development does **not** wait on Garena. Multi-source aggregation continues.
- If Garena grants a free/authorized API: register as provider `garena-official`
  (see `api/_lib/provider-registry.js`, `GARENA_INTEGRATION`) with high field-level
  priority for the fields it actually exposes — without removing other providers.
- If declined / no API: set `garenaOfficialIntegration: declined` with date + reply,
  and keep the multi-source architecture.

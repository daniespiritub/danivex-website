# Scanner profile image delivery

## Confirmed failure (2026-09-21 local time)

Baseline: `007ef7f`. Reproduced against production with the repository's isolated
Chromium test browser, not the user's Brave profile. Brave was not exposed by the
connected browser tool. `scripts/inspect-scanner-images.mjs` captures the actual
network response metadata, console errors and image decode state in ignored
`.qa/scanner-image-diagnostic/network.json`.

Affected requests:

- `https://www.freefiremania.com.br/images/itens/Icon_face_RUactivity.png`
- `https://www.freefiremania.com.br/images/itens/Icon_callsign_storebg_Valentine2020.png`

Actual browser response: HTTP 403, `content-type: text/html`,
`cf-mitigated: challenge`, `cross-origin-resource-policy: same-origin`.
Chromium reports `corp-not-same-origin` and
`net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`. This is a remote challenge response,
not a missing CSP hostname in DaniVex. Normal server HTTPS requests currently
return HTTP 200 PNGs (22,737 and 30,685 bytes). No challenge is solved or bypassed;
if the upstream refuses a server request, delivery fails closed.

## Scoped fix

`src/utils/scannerImages.js` maps only exact HTTPS FreeFireMania item PNG URLs to
`/api/profile-image?asset=<filename>`. Called when constructing the Scanner view
model, it also covers existing cached player responses. Nicknames, UIDs, profile
sources, rank, outfit and Prime resolution do not change. Other image hosts and
the banner catalog fallback retain their existing behavior.

The endpoint accepts a filename, never a URL:

- Fixed HTTPS origin `www.freefiremania.com.br:443` and `/images/itens/` path.
- Only ASCII basename PNG files; no query injection, traversal or other formats.
- DNS validation inside the socket's lookup callback; only validated public IPv4
  addresses are used. IPv6 and mapped addresses are rejected rather than guessed.
- Loopback, private, link-local, shared, documentation, multicast and reserved
  IPv4 ranges are denied, including cloud metadata addresses.
- No redirect following, even to the same host. TLS validation remains enabled.
- No incoming cookies, authorization, referer or arbitrary request headers forwarded.
- Five-second total deadline including DNS, headers and body; 512 KiB response cap.
- HTTP 200, PNG MIME type, binary signature, IHDR and bounded dimensions required.
  HTML, SVG and compressed upstream responses are rejected.
- Existing per-IP public endpoint limiter (30/minute, best-effort Redis) before
  origin fetching. Successful responses are CDN cached for one day; errors are
  not cached. Browser cache lasts one hour. Stale revalidation lasts seven days.
- Same-origin resource policy and `nosniff`; no new CORS permission.
- Existing site CSP is unchanged. No secrets or provider SDK enter the bundle.

The public rate limiter retains its existing fail-open behavior during Redis
outages. CDN caching reduces repeat origin traffic; this is not a hard global
spending limit. The upstream remains an availability dependency. A future
upstream refusal, rename or permanent image removal requires revisiting the
source or falling back to a verified catalog asset, not bypassing its challenge.

## Verification

`tests/profile-image-proxy.test.js`: 12 cases covering URL mapping, host/IP
validation, mixed DNS answers, pinning, redirects, traversal, MIME/magic, maximum
size, dimensions, timeouts before/during body, errors, cache policy, HEAD and rate
limiting. Existing account/session/RLS and public tests remain in the full suite.

`scripts/qa-release.mjs` now requires the real player provider to succeed (an
outage is no longer a passing warning), verifies both profile images are decoded
same-origin PNG responses, and checks Scanner at all six release viewports.

References: [Node HTTPS](https://nodejs.org/api/https.html#httpsrequestoptions-callback)
and [DNS lookup](https://nodejs.org/api/dns.html#dnslookuphostname-options-callback).

## Rollback

Revert the scoped Scanner image fix commit, then redeploy. No data migration,
environment variable or cache purge is required. The baseline production deploy
remains available for an emergency rollback; it has the original image failure.

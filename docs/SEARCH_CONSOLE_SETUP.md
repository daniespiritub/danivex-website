# Search Console setup

Use the existing owner's Google Search Console domain property if present. Verify
danivex.com through the DNS TXT value supplied by Google, not an invented token.
Submit https://danivex.com/sitemap.xml. Inspect /, /player-scanner and /privacy with
live rendering; check canonical selection, mobile usability and indexing issues.
Auth/account routes must remain noindex and absent from sitemap. Do not submit
arbitrary player UID pages or private URLs. DNS verification and property access
were not available to this implementation; no verification claim is made.

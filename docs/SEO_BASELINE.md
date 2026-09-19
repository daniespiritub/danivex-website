# SEO baseline

Home and `/player-scanner` have distinct title, description, canonical and social
metadata. `public/robots.txt` and `public/sitemap.xml` exist (two public URLs).
Build emits Scanner HTML metadata but no rendered body. Search engines need JS.
No account/private content currently exists. Avoid inventing product/Android pages.

Add a real privacy page, index only useful public URLs, and noindex all auth/account
surfaces in generated HTML and HTTP headers. Preserve old Scanner redirects.
Do not publish empty programmatic UID pages into sitemap. Add no misleading schema,
reviews, ratings or download numbers. Search Console ownership remains external.

Public live homepage returned HTTP 200 on 2026-09-19. Body extraction without JS
returned no readable text. This remains an explicit SSR/prerender limitation.

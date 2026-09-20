# SEO audit

Preserved home and Scanner titles, canonicals, social images and legacy redirects.
Added /privacy with meaningful static body content and metadata. Added private
account/auth HTML with noindex; private APIs also send X-Robots-Tag and no-store.
Sitemap contains only home, Scanner and privacy. No invented products, fake reviews,
ratings or structured data. Existing public language selection has no distinct locale
URLs, so hreflang is deliberately not fabricated.

Known limitation: home/Scanner still depend on client JS for body content. Their
route metadata exists without JS. A separate measured prerender/SSR enhancement is
not silently represented as completed. No search ranking guarantee. Search Console
and Core Web Vitals field metrics need owner access/real traffic.

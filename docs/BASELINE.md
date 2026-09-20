# Baseline - 2026-09-19

Repository: `daniespiritub/danivex-website`; starting commit `f39a2f2`.
Working branch: `feat/account-platform-20260919`. Pre-existing, uncommitted
Companion changes and experimental assets are excluded from this delivery.

## Detected system

- React 19, JavaScript, Vite 8, custom pathname routing in `src/App.jsx`.
- `src/pages/HomePage.jsx`: sensitivity, lazy device search, languages ES/PT/EN,
  Mobilador release, community, real Redis-backed visit count.
- `src/pages/PlayerScanner.jsx`: public UID profiles, comparison, share and timeline.
- `src/companion/`: Three.js rigged GLB, animations, placement and accessibility.
- `api/`: Vercel Node functions; Redis stores public Free Fire observations,
  rate limits and visits. There is NO existing account database or authentication.
- `app/layout.js` is not a Next.js entry point in this Vite application.
- `vite.config.js`: generates route-specific HTML metadata, not body SSR.
- `public/`: static icons, robots, sitemap, licensed Companion and legacy SW cleanup.

## Evidence before implementation

- `npm test`: 228 passed, 0 failed, 0 skipped.
- `npm run build`: PASS. Initial JS 275.05 kB / 86.42 kB gzip;
  lazy renderer 589.66 kB / 148.00 kB gzip; lazy catalog 918.52 kB / 215.04 kB gzip.
- `npm audit --omit=dev`: 0 reported vulnerabilities (not a security guarantee).
- `npm run lint`: FAIL, 18 errors in ignored experimental `.qa/.../torch/.../code.js`.
  The lint configuration incorrectly includes local third-party experiments.
- Browser baseline at 360/390/430/768/1024/1440: no horizontal overflow or
  page exceptions. Images: `.qa/platform-baseline/`. Canvas not ready at this
  early capture; this is NOT evidence of successful 3D rendering.
- `https://danivex.com/`: HTTP 200, Vercel, HTTPS/HSTS; no CSP/nosniff/referrer
  policy observed. DNS A: 64.29.17.65 / 216.198.79.65.
- Vercel deployment `dpl_CSirmPjGekxCkMcj1mj1AMLNiJB3` Ready, both apex and www
  assigned to `danivex-website`; production dated 2026-09-15.
- Vercel configured keys: SiamBhau and Redis only. No Supabase, OAuth or AI keys.
  Values were not printed. GitHub CLI is not authenticated; Vercel CLI is.

## Preservation boundary

Do not replace the character, sensitivity rules, existing releases or Scanner.
Do not publish experimental `.qa` assets. No synthetic visits or fake account data.
Do not call external registration complete without real provider verification.

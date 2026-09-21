# Companion Framing Update (2026-09-16)

## Scope

- Home hero uses a waist-up orthographic framing of the real GLB.
- Scrolling the hero out of view selects a smaller full-body framing at a
  free bottom corner. Returning to the top restores the portrait framing.
- The same Three.js renderer and character instance are retained across
  framing changes. No second model download or context is required.
- Desktop floating bounds: 120 x 196 CSS px; mobile: 100 x 148 CSS px.
- Bottom margin stays 60 px to clear the visitor counter and phone controls.
- Camera framing is independent of the replaceable character asset.
- Scanner anchors retain their full-body framing.

## Safety and Limitations

Content collision protection still wins over decoration. If both bottom
corners are occupied, the Companion minimizes into the navigation dock rather
than jumping to the middle of the page. Dense mobile forms therefore often
show the dock instead of a full-body overlay. Mobile editing, the keyboard
and dialogs hide the Companion. Pause, minimize and reduced-motion settings
remain available.

The user requested a chibi appearance like the video. The original rig is
still in use: a new design reference is saved under `assets/companion/concepts`,
but its 3D conversion is blocked by Fal's `balance_exhausted` response.
Do not describe the visual character redesign as completed or published.

## Files

- `src/components/home/PlatformHero.jsx`: opts the home into portrait framing.
- `src/companion/framing.js`: camera profiles.
- `src/companion/CompanionRenderer.jsx`: camera updates without GLB reload.
- `src/companion/DaniVexCompanion.jsx`: passes the framing to the renderer.
- `src/companion/useCompanionPosition.js`: resolves framing from the anchor.
- `src/companion/placement.js`: bottom-only floating placement and resize rules.
- `src/companion/companion.css`: framing margins and reduced-motion-aware entry.
- `tests/companion.test.js`: portrait/full framing and bottom placement tests.
- `scripts/qa-companion-framing.mjs`: browser checks and screenshots.

No sensitivity calculations, device catalogs, routes, API handlers, service
workers, production configuration or existing GLB contents were changed.

## Verification

Run `npm test`, `npm run lint`, `npm run build`,
`node scripts/qa-companion-framing.mjs`, and `npm run test:platform`.
Browser outputs are written under ignored `.qa/framing`.

Local results on 2026-09-16:

- Unit tests: 228 passed, 0 failed.
- ESLint: passed.
- Production build: passed; the existing large lazy Three.js/device chunks
  still produce Vite's non-blocking size advisory.
- Framing browser suite: 7 passed, 0 console/page/HTTP errors. Includes
  320/390/701/768/1280/1440 px widths, reduced motion, scroll return, pixel
  checks and one GLB request across every scroll sequence.
- Platform regression suite: 13 passed, 0 console/page/HTTP errors. Covers
  existing sensitivity, languages, catalog, scanner and Companion controls.
- Original GLB SHA-256 is unchanged:
  `4943a27ede572755b24230d0ed0e78f3d8243f7b085ad9970e07764fb5c4359a`.

No commit, push or deployment was performed for this follow-up. Changes are
saved locally; the visual chibi replacement is incomplete and must not be
reported as shipped. Once generation is available, validate the new rig's
bone aliases, facial animation support and all poses before replacing the
existing asset and running both browser suites again.

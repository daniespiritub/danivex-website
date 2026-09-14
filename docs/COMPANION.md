# DaniVex Companion

## Current asset

The shipped character is a temporary, articulated Three.js model built from
geometry, not a floating image. It follows the approved reference: black cap
with yellow D, uncovered friendly face, large brown eyes, dark/red clothing,
purple trousers. It is not the final sculpt or a reconstructed scan.

Reference-to-3D upload through the available Fal integration returned Forbidden.
No conversion job or paid generation was started. The final model remains an
art-production replacement, independently of the working interaction system.

## Replace the character

1. Export a rigged, self-contained glTF 2.0 GLB with embedded textures.
2. Place it at `public/companion/DaniVexCharacter.glb`.
3. Set `companionAsset.modelUrl` in `src/companion/config.js` to
   `/companion/DaniVexCharacter.glb`.
4. Match animation clip names using the aliases in that config. Minimum: Idle
   and Wave. Recommended: Look, Curious, Thinking, Happy, Celebrate, Walk,
   Surprised, Bored, Sleepy, PointLeft and PointRight.
5. Adjust `rotationY` if the export faces away from the camera. The adapter
   normalizes height and centers the model with its feet on the ground.
6. Run `npm test`, `npm run build` and `npm run test:platform` against the dev
   server. Inspect the character at desktop and mobile sizes before deploying.

Use ordinary GLB initially: the adapter does not currently configure Draco or
KTX2 decoders. Aim for a 1-2 MB asset, fewer than 50k triangles, shared materials
and textures of at most 1024px where possible. These are production budgets,
not claims about an unavailable final asset. Preserve normal expressive eyes,
the cap letter, bare face and the approved silhouette in the art review.

The adapter loads GLTFLoader only when a GLB is configured. Failed model loads
fall back to procedural geometry. Missing clips fall back to Idle/the first
available clip. A new renderer backend would only need to preserve the same
`root`, `update` and `dispose` character adapter contract.

## Responsibilities

- `DaniVexCompanion.jsx`: isolated error boundary, deferred renderer and controls.
- `CompanionRenderer.jsx`: one transparent canvas, camera/lights, frame budget,
  resize and complete WebGL/resource cleanup, including React StrictMode.
- `createCharacter.js` / `loadCharacter.js`: asset and animation implementations.
- `machine.js`: pure state transitions; greeting starts only after asset ready.
- `useCompanionController.js`: events, throttling, inactivity, reduced motion,
  visibility and persistent minimize/motion preferences.
- `useCompanionPosition.js` / `placement.js`: section observation and deterministic
  collision avoidance. No space means a small navigation dock, not overlap.
- `config.js`: asset aliases and `reactCompanion(type)` frontend event interface.

Sections opt in through `data-companion-section` and `data-companion-side`.
Important blocks use `data-companion-obstacle`. The observer also checks common
interactive/text elements. On mobile, focused fields, the keyboard viewport and
open dialogs hide the character. No cursor-follow on touch devices.

The animation loop is capped at 30 fps desktop / 20 fps mobile, pixel ratio at
1.5 / 1.25 respectively. Hidden tabs, docked/hidden state and reduced motion stop
continuous rendering. There is no audio, external telemetry or interaction with
backend data. Preferences use the local key `danivex:companion` only.

## Verification

`tests/companion.test.js` covers state, placement, geometry/disposal and unchanged
sensitivity output. `scripts/qa-platform.mjs` verifies eight viewport sizes,
pixel-colored geometry, actual motion, greeting, controls, no-WebGL fallback,
catalog, languages, screenshots and Player Scanner.

Local QA uses an isolated browser with visit fixtures and a captured public
player response. It does not change application API behavior. Set
`DANIVEX_QA_URL=https://danivex.com` to exercise real production endpoints.
Reports and screenshots are written to ignored `.qa/` directories.

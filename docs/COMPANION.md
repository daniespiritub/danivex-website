# DaniVex Companion

## Asset and Rights

The rejected procedural character has been removed, including its fallback.
`public/companion/DaniVexCharacter.glb` is a genuinely rigged 3D adaptation of
Blender Studio's professionally authored Snow v4. It is a licensed derivative,
not an exclusively original DaniVex sculpt. Required credit:
**Snow Rig (CC) Blender Foundation | studio.blender.org**.

Source: https://studio.blender.org/characters/snow/v4/
License: https://creativecommons.org/licenses/by/4.0/
Attribution is embedded in the GLB and linked from the website footer through
`public/companion/CREDITS.txt`. Complete CC BY, Three.js MIT and Draco Apache
license notices are distributed beside the asset.

DaniVex adaptations include graphite fabric, violet trousers, red fabric/suede,
rubber soles, raised gold DV monogram, baked PBR atlases, independent web rig,
facial morphs and authored Companion clips. No geometry from the rejected
character is included. The original Blender source remains untouched.

## Art Pipeline

`scripts/companion/README.md` documents the official source/checksums and the
Blender 4.5 pipeline. `build.ps1` produces an editable blend and a compressed
candidate in ignored `.qa/companion-source/web`; it never publishes automatically.
The source CloudRig runs only during local authoring, not in the website.

The web asset has 73 deform bones, 14 named clips and six facial morphs:
Blink, Smile, Surprised, Curious, Sleepy and Relaxed. Body/fingers use skinning; head/eye
bones add bounded pointer tracking. Draco geometry and embedded WebP textures
keep the asset at 7,951,192 bytes. Normal-map tangents are baked before final compression.

## Runtime Responsibilities

- `DaniVexCompanion.jsx`: isolated error boundary, delayed renderer and translated controls.
- `CompanionRenderer.jsx`: transparent canvas, camera, resize and frame budget.
- `lighting.js`: soft studio environment, key/fill/rim and faint contact shadow.
- `loadCharacter.js`: lazy GLTF/Draco loading, one decoder worker and failure cleanup.
- `characterRuntime.js`: normalization, clip transitions, facial morphs, gaze and disposal.
- `machine.js`: pure state transitions; greeting starts only after the asset is ready.
- `useCompanionController.js`: events, inactivity, reduced motion and persistent preferences.
- `useCompanionPosition.js` / `placement.js`: reserved anchor, gutters and collision avoidance.
- `config.js`: model URL, dimensions, clip aliases and frontend event interface.

The renderer is deferred 650 ms and stays outside the initial application chunk.
No model loads when minimized. The device catalog remains independently lazy.
Animation is capped at 30 fps desktop / 20 fps mobile and DPR at 1.5 / 1.25.
Hidden tabs, docked/hidden state, pause and reduced motion stop continuous rendering.
Textures, ImageBitmaps, skeletons, geometries, materials, decoder workers, environment
maps, animation actions and WebGL contexts are explicitly released.

Sections declare `data-companion-section`, `data-companion-side` and protected
`data-companion-obstacle` areas. Focused mobile fields, the keyboard and dialogs
hide the overlay. A dense layout uses the small navigation dock. Animated travel
is allowed only when its entire swept rectangle is clear; it cannot cross controls.
The existing controller and positioning are independent of the replaceable asset.
There is no audio, advertising, telemetry or new access to backend data.

## Replace or Rebuild

Use a self-contained GLB with licensed textures, skinning and matching clips:
Idle, Wave, Look, PointLeft, PointRight, Happy, Celebrate, Thinking, Surprised,
Walk, Hop, Bored, Sleepy and Return. Update `config.js` aliases for other names.
Height/grounding is normalized; `rotationY` adjusts forward direction. Failed
model loads use the existing accessible dock, never the rejected geometry.

## Verification and Limits

`tests/characterRuntime.test.js` checks the shipped GLB structure/license/budget,
clip aliases, Intro-to-Idle looping, expressions, gaze bounds, pause and disposal.
`tests/companion.test.js` covers states, safe placement and unchanged sensitivity.
`scripts/companion/qa-asset.mjs` renders 28 multi-angle/pose frames from the actual
GLB, verifies foot/hip/wrist motion and captures a local browser timing sample.
`qa-motion.mjs` records nine clips playing in real time and their joint trajectories.
`scripts/qa-platform.mjs` checks eight viewport sizes, canvas pixels/motion,
controls, reduced motion, WebGL failure, sensitivity/catalog/languages and scanner.

Local platform QA confines API fixtures to its isolated browser. Production QA
uses real endpoints: `$env:DANIVEX_QA_URL='https://danivex.com'; npm run test:platform`.
Evidence is written under `.qa/`, not deployed. Browser mobile emulation does
not substitute for testing every physical low-end phone. The model favors visual
quality (179,362 triangles, 18 draw calls) over an ultra-low-poly budget; its download
is deferred but still matters on slow connections. Check actual load and frame
timings before increasing texture/geometry budgets.

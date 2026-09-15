# Companion Replacement Acceptance

Date: 2026-09-15. Scope: replacing the rejected procedural Companion, not a
redesign of the other tools. The original detailed request is attachment a8314e1e.

## Final Asset

- File: `public/companion/DaniVexCharacter.glb`, 7,951,192 bytes.
- SHA-256: `4943a27ede572755b24230d0ed0e78f3d8243f7b085ad9970e07764fb5c4359a`.
- Source: Snow v4, Blender Studio, CC BY 4.0; licensed adaptation, not an exclusive sculpt.
- 73 bones; 14 clips; six morphs; 179,362 rendered triangles; 18 draw calls.
- Graphite shirt, continuous red cuffs, violet trousers, gold DV, red/white sneakers.
- Original geometry/fallback deleted from the application. No floating reference image.

## Review Verdict

Initial independent reviewer: `fix`, five material findings. All initial
26 model frames and eight web viewport pairs were reviewed. The external
post-fix reviewer could not run because its tool returned a usage-limit error.
Final scoring and document reconciliation were therefore performed in-thread;
this is not represented as an independent post-fix approval.

### Verdict

| Finding | Score | Current evidence under `.qa/companion-source/review/final-webgl/` |
| --- | --- | --- |
| Gray surprise pupils | Resolved | `surprised.png`: dark pupil interiors, distinct iris; no broad gray reflection. |
| Fixed tooth grin | Resolved | `sleepy.png`, `bored.png`, `thinking.png`: relaxed lower face instead of the smile. |
| Hips-only hop | Resolved | `hop-0..6.png`: crouch, whole-body rise and recovery; hips Y 1.729..1.910, wrist Y 1.743..1.932. |
| Pointing gaze reversed | Resolved | `point_left.png`, `point_right.png`: head and eyes follow the indicated side. |
| Stepped cuffs/sole | Resolved | `thinking.png`: continuous cuff boundary; `idle-shoes.png`: clean continuous white sole edge, no red atlas patches. |

### Remaining

Clear for the five scored fixes. Disposition: **ship**, limited to these findings.
The independent first review's accepted source/proportions/material/placement
decisions remain intact. Publication still requires the production gate below.

## Requirement Evidence

| Requirement | Evidence |
| --- | --- |
| Real dimensional face/body/hair/hands/shoes | Rigged GLB; front, three-quarter, side, back, face, hand and shoe captures. |
| Expressive face | Blink/Smile/Surprised/Curious/Sleepy/Relaxed morphs plus head/eye bones; runtime and pixel checks. |
| Named animation set | Idle, Wave, Look, PointLeft, PointRight, Happy, Celebrate, Thinking, Surprised, Walk, Hop, Bored, Sleepy, Return. |
| Continuous animation | `animation-review.webm`, nine live clips; `motion-timeline.json` contains timestamped world joint samples. |
| Transparent independent overlay | Existing renderer/controller/placement retained; no layout card or image replacement. |
| Desktop/mobile size and no overlap | 1920/1440/1280/1024/768/390/360/320px platform screenshots, canvas pixels and collision checks. |
| Pausing and reduced motion | Tests cover pause, minimized persistence, inactivity, return and unavailable WebGL; failed-GLB check leaves tools/dock intact. |
| Performance | Deferred renderer/GLB, 30/20fps caps, 1.5/1.25 DPR caps, worker disposal, compressed embedded textures/geometry. |
| Existing tools preserved | No changes to APIs, routes, device data, sensitivity utilities or package dependencies; 225 tests and 13 local browser groups pass. |
| Rights | Public CREDITS link, CC BY full text, embedded source/license, MIT/Apache notices. |

## Limitations

Physical low-end Android/iPhone hardware has not been tested. Browser mobile
emulation and local GPU measurements do not prove all-device performance.
The deferred ~7.95 MB asset still costs bandwidth on slow connections. A cold
production test at 4Mbps/80ms and 4x CPU slowdown measured FCP 1.23s, usable iOS
selection 1.64s and the first rendered Companion at 19.54s. HTTP compression
transferred 5.43 MB for the GLB. This is one measured run, not a universal SLA.
Vite's
large-chunk advisory concerns separately loaded Three.js and device catalog,
not a build failure. glTF validation reports no errors; parented-skin and unused
attribute advisories are checked against actual Three.js rendering.

## Production Gate

- Functional commit: `c3e86859c75d4bb892e194e8d4491ec19c1479ad`, pushed to `origin/main`.
- Vercel automatic deployment: `dpl_F4kXBNcyeF419ZDJ7yLWtsQeuJPy`, Ready.
- Immutable URL: https://danivex-website-1ges8ysyv-daniespiritubs-projects.vercel.app
- Public aliases: https://danivex.com and https://www.danivex.com.
- Production browser QA: 13/13 groups, eight viewport sizes, no API fixtures,
  no console/page/HTTP errors or horizontal overflow in tested views.
- Sensitivity, device catalog/fallback, ES/PT/EN, download controls, Companion
  states/pause/docking and real Player Scanner nickname/images passed.
- Public GLB: HTTP 200, correct MIME, 7,951,192 bytes and the SHA-256 listed above.
- Credits, decoder JS/WASM, root and www respond 200. Desktop/mobile production
  captures show the replacement model rather than the rejected geometry.
- Reports: `.qa/production/report.json`, `asset-verification.json`,
  `throttled-loading.json` and the production screenshots.

This documentation checkpoint follows that verified functional release; it does
not change application code or the reviewed public asset.

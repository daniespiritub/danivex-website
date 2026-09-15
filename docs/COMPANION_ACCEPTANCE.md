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
The deferred ~7.95 MB asset still costs bandwidth on slow connections. Vite's
large-chunk advisory concerns separately loaded Three.js and device catalog,
not a build failure. glTF validation reports no errors; parented-skin and unused
attribute advisories are checked against actual Three.js rendering.

## Production Gate

Pending commit, push, deployment and live-domain verification. Do not mark the
thread goal complete until this section contains the verified production result.

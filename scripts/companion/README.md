# Companion Art Pipeline

## Source and License

The former procedural character is rejected and is not an input to this pipeline.
This asset adapts the professionally authored Snow v4 rig from Blender Studio.
It is a derivative, not an exclusively original sculpt.

- Source: https://studio.blender.org/characters/snow/v4/
- License: https://creativecommons.org/licenses/by/4.0/
- Required credit: **Snow Rig (CC) Blender Foundation | studio.blender.org**
- Archive SHA-256: `98d58ef3a07083ede14140bc462cccb55d317062846aa0eb652d2e4a7ac422a6`
- Archive contains `Snow/snow_v4.2.blend` and the authored texture files.
- Blender 4.5.13 Windows portable SHA-256:
  `b5fdf800ce65fa2f209e8f68d02667e4d720fa1c42f247c72d1882ab04decba6`
  verified against the official blender.org release checksum before execution.

Modifications: DaniVex colors, neutral-pose and gesture adjustments,
facial morph sampling, independent web deform rig, texture atlases and custom
Companion animation clips. The original authoring file is never overwritten.

## Reproduction

Run from the repository root with Blender 4.5 LTS. Binaries and downloaded
art files are kept under ignored `.qa/companion-source`, not in the web bundle.
Review the embedded CloudRig Python before enabling auto-execution. The supplied
source scripts were inspected for external I/O; only the official local rig code
is needed, never server-side evaluation or code sent to website visitors.

1. `inspect_source.py` and `inspect_rig.py`: inventory and embedded source review.
2. `review_source.py`: original candidate render; `-- --adapt` reviews direction.
3. `build_web_asset.py`: fixed evaluated topology, named facial morphs and web rig.
4. Open generated `web/geometry.blend` and run `bake_materials.py`.
5. Open generated `web/materials.blend` and run `author_animation.py`.
6. Open `web/animated.blend` and run `export_web_asset.py`. This adds garment
   accents and a raised monogram, retains an editable file and exports only
   the web objects and named clips with Draco compression.
7. `build.ps1` runs pinned `@gltf-transform/cli@4.5.0`: WebP quality 94,
   MikkTSpace tangents, then Draco sequential compression (positions 15 bits,
   normals 12 bits, UVs 14 bits). Recompression is last because WebP/tangents
   decode the earlier compressed geometry. Sequential mode preserves morph order.
8. Review the converted model and clips before integration. A successful
   command is not proof of acceptable face, hand, rig or material quality.

`scripts/companion/build.ps1` runs the four build stages in sequence. Pass
`-Blender` / `-Source` for different local locations. Blender is invoked with
`--python-exit-code 1` so a Python exception cannot masquerade as a passing build.
It does not publish, commit, or copy a candidate into the public directory.
`-OptimizeOnly` repeats only the three glTF Transform stages. The optimized
candidate is `web/DaniVexCharacter-optimized.glb`. After visual acceptance, copy
it to `public/companion/DaniVexCharacter.glb`. No authoring dependencies are added
to the application package; npx uses its normal external tool cache.

Intermediate files and visual evidence are local artifacts. License and final
credits must accompany any publicly distributed derivative GLB.

## Browser Review

With Vite running on port 5173, run `node scripts/companion/qa-asset.mjs`.
It loads the actual GLB using the production adapter and lighting and writes
28 pose/detail frames, contact sheets, motion measurements and a JSON report.
`qa-motion.mjs` also records live clips and time-stamped joint trajectories.
The authoring/QA viewer is not an application route or a Vite build entry.
Run `npm test`, `npm run lint`, `npm run build` and `npm run test:platform`.
Verify the live site after deployment; exports alone never establish acceptance.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AnimationClip, Bone, BoxGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, NumberKeyframeTrack, Texture } from 'three'
import { companionAsset } from '../src/companion/config.js'
import { createCharacterRuntime } from '../src/companion/characterRuntime.js'

// Small synthetic fixture exercises the adapter, never shipped as a character.
function fixture() {
  const scene = new Group()
  const head = new Bone()
  head.name = 'DEF-Head'
  scene.add(head)
  const eye = new Bone()
  eye.name = 'DEF-EyeL'
  head.add(eye)
  const geometry = new BoxGeometry(1, 2, 1)
  geometry.morphAttributes.position = Array.from({ length: 6 }, () => new Float32BufferAttribute(geometry.attributes.position.array.slice(), 3))
  const mesh = new Mesh(geometry, new MeshStandardMaterial())
  mesh.morphTargetDictionary = { Blink: 0, Smile: 1, Surprised: 2, Curious: 3, Sleepy: 4, Relaxed: 5 }
  scene.add(mesh)
  const driver = new Group()
  driver.name = 'AnimationProbe'
  scene.add(driver)
  const animations = ['Idle', 'Wave', 'Sleepy', 'Surprised', 'Thinking', 'Bored'].map((name) =>
    new AnimationClip(name, 1, [new NumberKeyframeTrack('AnimationProbe.position[x]', [0, .5, 1], [0, 1, 0])]))
  const runtime = createCharacterRuntime({ scene, animations }, companionAsset)
  const advance = (action, seconds = 1, motion = true, pointer = { x: 0, y: 0 }) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) runtime.update({ delta: 1 / 60, action, motion, pointer })
  }
  return { runtime, mesh, head, eye, driver, advance }
}

test('GLB: complete licensed rig, facial shapes, textures and required animations', () => {
  const buffer = readFileSync(new URL('../public/companion/DaniVexCharacter.glb', import.meta.url))
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF')
  assert.equal(buffer.readUInt32LE(4), 2)
  assert.equal(buffer.readUInt32LE(8), buffer.length)
  assert.ok(buffer.length < 8_000_000, 'compressed asset budget')
  const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)))
  assert.match(gltf.asset.copyright, /Snow Rig.*Blender Foundation.*CC BY 4.0/)
  assert.ok(gltf.skins.some((skin) => skin.joints.length >= 70))
  assert.ok(gltf.nodes.some((node) => /Finger_Index3/.test(node.name)))
  assert.ok(gltf.nodes.some((node) => /Eye/.test(node.name)))
  const names = gltf.animations.map((animation) => animation.name)
  for (const clip of ['Idle', 'Wave', 'Look', 'PointLeft', 'PointRight', 'Happy', 'Celebrate', 'Thinking', 'Surprised', 'Walk', 'Hop', 'Bored', 'Sleepy', 'Return']) assert.ok(names.includes(clip), clip)
  for (const aliases of Object.values(companionAsset.clips)) assert.ok(aliases.some((name) => names.includes(name)), aliases.join(', '))
  for (const shape of ['Blink', 'Smile', 'Surprised', 'Curious', 'Sleepy', 'Relaxed']) assert.ok(gltf.meshes.some((mesh) => mesh.extras?.targetNames?.includes(shape)), shape)
  for (const image of gltf.images) { assert.ok(Number.isInteger(image.bufferView)); assert.equal(image.uri, undefined) }
  assert.ok(gltf.extensionsUsed.includes('KHR_draco_mesh_compression'))
  assert.ok(gltf.extensionsUsed.includes('EXT_texture_webp'))
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) assert.ok(Number.isInteger(primitive.attributes.TANGENT))
})

test('Runtime: shared Intro/Idle alias switches to looping instead of freezing', () => {
  const f = fixture()
  f.advance('INTRO', .5)
  f.advance('IDLE', 2.5)
  assert.ok(f.driver.position.x > .9)
  f.advance('IDLE', .25)
  assert.ok(f.driver.position.x < .6)
  f.runtime.dispose()
})

test('Runtime: bounded gaze, finite matrices, expressions and paused animation', () => {
  const f = fixture()
  f.advance('IDLE', 3, true, { x: 999, y: -999 })
  assert.ok(f.head.rotation.y > .09 && f.head.rotation.y < .13)
  assert.ok(f.head.rotation.x > -.08 && f.head.rotation.x < -.04)
  const angle = f.head.quaternion.clone()
  f.advance('IDLE', 3, true, { x: 999, y: -999 })
  assert.ok(angle.angleTo(f.head.quaternion) < .001, 'gaze must not accumulate')
  f.advance('SURPRISED')
  assert.ok(f.mesh.morphTargetInfluences[2] > .89)
  f.advance('SLEEPY')
  assert.ok(f.mesh.morphTargetInfluences[4] > .94)
  f.advance('THINKING')
  assert.ok(f.mesh.morphTargetInfluences[5] > .94)
  f.advance('IDLE', 2)
  const position = f.driver.position.clone()
  const morphs = f.mesh.morphTargetInfluences.slice()
  f.advance('WAVE', 5, false)
  assert.deepEqual(f.driver.position, position)
  assert.deepEqual(f.mesh.morphTargetInfluences, morphs)
  f.runtime.root.updateMatrixWorld(true)
  f.runtime.root.traverse((object) => assert.ok(object.matrixWorld.elements.every(Number.isFinite)))
  f.runtime.dispose()
})

test('Runtime: natural blink and shared resources disposed exactly once', () => {
  const f = fixture()
  f.advance('IDLE', 4.55)
  assert.ok(f.mesh.morphTargetInfluences[0] > .65)
  f.advance('IDLE', .4)
  assert.ok(f.mesh.morphTargetInfluences[0] < .001)
  let textures = 0, geometries = 0, materials = 0, closed = 0
  const texture = new Texture({ close() { closed++ } })
  f.mesh.material.map = f.mesh.material.normalMap = texture
  texture.addEventListener('dispose', () => textures++)
  f.mesh.geometry.addEventListener('dispose', () => geometries++)
  f.mesh.material.addEventListener('dispose', () => materials++)
  f.runtime.root.add(new Mesh(f.mesh.geometry, f.mesh.material))
  f.runtime.dispose()
  f.runtime.dispose()
  assert.deepEqual([textures, geometries, materials, closed], [1, 1, 1, 1])
})

test('Runtime: invalid assets fail instead of constructing an old placeholder', () => {
  assert.throws(() => createCharacterRuntime({ scene: new Group(), animations: [] }, companionAsset), /Invalid Companion/)
})

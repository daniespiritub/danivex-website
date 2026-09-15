import * as THREE from 'three'
import { loadCharacter } from '../../src/companion/loadCharacter.js'
import { createCompanionLighting } from '../../src/companion/lighting.js'

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
createCompanionLighting(renderer, scene)
const camera = new THREE.OrthographicCamera(-2, 2, 2.5, -2.5, .01, 30)
const character = await loadCharacter()
scene.add(character.root)
let time = 0
let action = 'IDLE'
let running = false

function render() {
  renderer.render(scene, camera)
}
function setView(view = 'front') {
  const face = view === 'face'
  const hands = view === 'hands'
  const shoes = view === 'shoes'
  const target = new THREE.Vector3(0, face ? 3.3 : hands ? 2.55 : shoes ? .3 : 1.8, 0)
  camera.position.set(...(view === 'back' ? [0, 1.9, -9] : view === 'side' ? [9, 1.9, 0] : view === 'three-quarter' ? [4, 2.1, 8] : [0, face ? 3.3 : 1.9, 9]))
  camera.lookAt(target)
  if (hands || shoes) { camera.position.set(2, target.y + .1, 8); camera.lookAt(target) }
  const span = face ? 1.18 : hands ? 1.85 : shoes ? .9 : 4.35
  camera.left = -span * innerWidth / innerHeight / 2
  camera.right = -camera.left
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.updateProjectionMatrix()
  render()
}

window.assetQA = {
  ready: true,
  setView,
  pose(next, seconds = 1) {
    action = next
    for (let step = 0; step < Math.ceil(seconds * 30); step++) {
      time += 1 / 30
      character.update({ delta: 1 / 30, time, action, pointer: { x: 0, y: 0 }, motion: true })
    }
    render()
  },
  run(value) { running = value },
  pointer(x, y) {
    for (let i = 0; i < 50; i++) character.update({ delta: 1 / 30, action: 'IDLE', pointer: { x, y }, motion: true })
    render()
  },
  stats() {
    const bones = []
    const morphs = []
    character.root.traverse((o) => {
      if (o.isBone) bones.push(o.name)
      if (o.morphTargetDictionary) morphs.push({ name: o.name, keys: o.morphTargetDictionary, values: o.morphTargetInfluences })
    })
    const joints = {}
    character.root.traverse((o) => {
      if (o.isBone && /DEF-(Hips|Foot[LR]|Wrist[LR])$/.test(o.name)) joints[o.name] = o.getWorldPosition(new THREE.Vector3()).toArray()
    })
    return { bones, morphs, joints, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }
  },
  benchmark(frames = 60) {
    const start = performance.now()
    for (let i = 0; i < frames; i++) { character.update({ delta: 1 / 30, action: 'IDLE', motion: true }); render() }
    renderer.getContext().finish()
    return { frames, elapsedMs: performance.now() - start, viewport: [innerWidth, innerHeight] }
  },
}
setView()
window.assetQA.pose('IDLE', .1)
let last = performance.now()
function animate(now) {
  if (running) {
    const delta = Math.min((now - last) / 1000, .1)
    character.update({ delta, action, pointer: { x: 0, y: 0 }, motion: true })
    render()
  }
  last = now
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)

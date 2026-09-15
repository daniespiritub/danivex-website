import { AnimationMixer, Box3, Group, LoopOnce, LoopRepeat, MathUtils, Quaternion, Vector3 } from 'three'

const xAxis = new Vector3(1, 0, 0)
const yAxis = new Vector3(0, 1, 0)
const looping = new Set(['IDLE', 'WAITING', 'THINKING', 'BORED', 'SLEEPY', 'MOVE_SIDE'])

export function disposeCharacter(root) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  const skeletons = new Set()
  const bitmaps = new Set()
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    if (object.skeleton) skeletons.add(object.skeleton)
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material)
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
  })
  for (const texture of textures) {
    if (texture.image?.close) bitmaps.add(texture.image)
    texture.dispose()
  }
  for (const bitmap of bitmaps) bitmap.close()
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const skeleton of skeletons) skeleton.dispose()
}

export function createCharacterRuntime(gltf, asset) {
  const root = new Group()
  const model = gltf.scene
  const bounds = new Box3().setFromObject(model)
  const size = bounds.getSize(new Vector3())
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid Companion geometry')
  const center = bounds.getCenter(new Vector3())
  const scale = asset.height / size.y
  model.scale.multiplyScalar(scale)
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
  root.add(model)
  root.rotation.y = asset.rotationY
  const mixer = new AnimationMixer(model)
  const clips = new Map(gltf.animations.map((clip) => [clip.name.toLowerCase(), clip]))
  const face = []
  const gaze = []
  const parentWorld = new Quaternion()
  const offset = new Quaternion()
  const pitch = new Quaternion()
  const yaw = new Quaternion()
  model.traverse((object) => {
    if (object.morphTargetDictionary) face.push(object)
    if (object.isBone && /DEF-(Head|Eye[._]?[LR])$/.test(object.name)) {
      gaze.push({ bone: object, base: object.quaternion.clone() })
    }
  })
  let playing = null
  let currentAction = null
  let elapsed = 0
  let lookX = 0
  let lookY = 0
  let disposed = false
  return {
    root,
    update({ delta, action, pointer = { x: 0, y: 0 }, motion }) {
      if (disposed) return
      const dt = motion ? Math.min(Math.max(delta, 0), .1) : 0
      elapsed += dt
      for (const { bone, base } of gaze) bone.quaternion.copy(base)
      const names = asset.clips[action] || asset.clips.IDLE
      const clip = names.map((name) => clips.get(name.toLowerCase())).find(Boolean) || clips.get('idle')
      if (clip && (motion || !playing)) {
        const next = mixer.clipAction(clip)
        if (next !== playing || currentAction !== action) {
          if (next !== playing) playing?.fadeOut(.28)
          next.reset().setLoop(looping.has(action) ? LoopRepeat : LoopOnce, Infinity)
          next.clampWhenFinished = true
          next.fadeIn(playing ? .28 : 0).play()
          playing = next
          currentAction = action
        }
      }
      mixer.update(dt)
      const canLook = !['SLEEPY', 'THINKING', 'POINT_LEFT', 'POINT_RIGHT'].includes(action)
      lookX = MathUtils.damp(lookX, canLook ? MathUtils.clamp(pointer.x || 0, -1, 1) : 0, 4, dt)
      lookY = MathUtils.damp(lookY, canLook ? MathUtils.clamp(pointer.y || 0, -1, 1) : 0, 4, dt)
      root.updateMatrixWorld(true)
      for (const { bone, base } of gaze) {
        const eye = /Eye/.test(bone.name)
        base.copy(bone.quaternion)
        bone.parent.getWorldQuaternion(parentWorld)
        yaw.setFromAxisAngle(yAxis, lookX * (eye ? .055 : .12))
        pitch.setFromAxisAngle(xAxis, lookY * (eye ? .035 : .065))
        offset.copy(parentWorld).invert().multiply(yaw).multiply(pitch).multiply(parentWorld)
        bone.quaternion.premultiply(offset)
      }
      const cycle = elapsed % 5.7
      const blink = cycle > 4.45 && cycle < 4.65 ? Math.sin((cycle - 4.45) / .2 * Math.PI) : 0
      const targets = {
        Blink: action === 'SLEEPY' ? 0 : blink,
        Smile: ['HAPPY', 'CELEBRATE', 'WAVE'].includes(action) ? .5 : 0,
        Surprised: action === 'SURPRISED' ? .9 : 0,
        Curious: ['CURIOUS', 'THINKING'].includes(action) ? .65 : 0,
        Sleepy: action === 'SLEEPY' ? .95 : action === 'BORED' ? .2 : 0,
        Relaxed: action === 'THINKING' ? .95 : action === 'BORED' ? .8 : 0,
      }
      if (motion) {
        for (const mesh of face) {
          for (const [name, target] of Object.entries(targets)) {
            const index = mesh.morphTargetDictionary[name]
            if (index !== undefined) mesh.morphTargetInfluences[index] = MathUtils.damp(mesh.morphTargetInfluences[index], target, name === 'Blink' ? 36 : 7, dt)
          }
        }
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      mixer.stopAllAction()
      mixer.uncacheRoot(model)
      disposeCharacter(root)
    },
  }
}

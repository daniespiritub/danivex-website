import { AnimationMixer, Box3, Group, Vector3 } from 'three'
import { createCharacter, disposeObject } from './createCharacter.js'
import { companionAsset } from './config.js'

export async function loadCharacter() {
  if (!companionAsset.modelUrl) return createCharacter()
  try {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
    const gltf = await new GLTFLoader().loadAsync(companionAsset.modelUrl)
    const root = new Group()
    const model = gltf.scene
    const bounds = new Box3().setFromObject(model)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const scale = companionAsset.height / Math.max(size.y, 0.001)
    model.scale.multiplyScalar(scale)
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
    root.add(model)
    root.rotation.y = companionAsset.rotationY
    const mixer = new AnimationMixer(model)
    const clips = new Map(gltf.animations.map((clip) => [clip.name.toLowerCase(), clip]))
    let playing = null
    return {
      root,
      update({ delta, action, motion }) {
        const names = companionAsset.clips[action] || companionAsset.clips.IDLE
        const clip = names.map((name) => clips.get(name.toLowerCase())).find(Boolean)
          || clips.get('idle') || gltf.animations[0]
        if (clip) {
          const next = mixer.clipAction(clip)
          if (next !== playing) {
            playing?.fadeOut(0.25)
            next.reset().fadeIn(0.25).play()
            playing = next
          }
        }
        mixer.update(motion ? delta : 0)
      },
      dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); disposeObject(root) },
    }
  } catch {
    // An unavailable replacement must never take the tools down with it.
    return createCharacter()
  }
}

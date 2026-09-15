import { createCharacterRuntime, disposeCharacter } from './characterRuntime.js'
import { companionAsset } from './config.js'

export async function loadCharacter() {
  if (!companionAsset.modelUrl) throw new Error('Companion asset is not configured')
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js')
  const decoder = new DRACOLoader().setDecoderPath('/companion/draco/')
  decoder.setWorkerLimit(1)
  let gltf
  try {
    const loader = new GLTFLoader().setDRACOLoader(decoder)
    gltf = await loader.loadAsync(companionAsset.modelUrl)
    return createCharacterRuntime(gltf, companionAsset)
  } catch (error) {
    if (gltf) disposeCharacter(gltf.scene)
    throw error
  } finally {
    decoder.dispose()
  }
}

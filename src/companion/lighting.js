import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createCompanionLighting(renderer, scene) {
  const studio = new RoomEnvironment()
  const generator = new THREE.PMREMGenerator(renderer)
  const environment = generator.fromScene(studio, .04)
  scene.environment = environment.texture
  scene.environmentIntensity = .45
  studio.dispose()
  generator.dispose()
  const lights = [
    new THREE.HemisphereLight(0xfff3e4, 0x53546b, .75),
    new THREE.DirectionalLight(0xffeedf, 2),
    new THREE.DirectionalLight(0xc5d6ff, .6),
    new THREE.DirectionalLight(0xb4cfff, 1.2),
  ]
  lights[1].position.set(-3, 5, 6)
  lights[2].position.set(3, 2, 5)
  lights[3].position.set(3, 3, -3)
  scene.add(...lights)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(0,0,0,.32)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  const map = new THREE.CanvasTexture(canvas)
  const geometry = new THREE.PlaneGeometry(1.05, .13)
  const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false })
  const shadow = new THREE.Mesh(geometry, material)
  shadow.name = 'DaniVexContactShadow'
  shadow.position.set(0, -.015, -.1)
  scene.add(shadow)
  return () => {
    scene.environment = null
    scene.remove(shadow, ...lights)
    environment.dispose()
    map.dispose()
    geometry.dispose()
    material.dispose()
  }
}

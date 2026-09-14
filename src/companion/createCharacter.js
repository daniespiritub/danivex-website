import * as THREE from 'three'

// Temporary, fully articulated geometry. The renderer consumes the same
// update/dispose contract for this character and for a production GLB.
export function createCharacter() {
  const root = new THREE.Group()
  const materials = {
    skin: new THREE.MeshStandardMaterial({ color: '#edac7d', roughness: 0.78 }),
    ear: new THREE.MeshStandardMaterial({ color: '#ca7858', roughness: 0.8 }),
    black: new THREE.MeshStandardMaterial({ color: '#191a20', roughness: 0.7 }),
    seam: new THREE.MeshStandardMaterial({ color: '#43414d', roughness: 0.65 }),
    hair: new THREE.MeshStandardMaterial({ color: '#362018', roughness: 0.94 }),
    red: new THREE.MeshStandardMaterial({ color: '#d92f36', roughness: 0.6 }),
    purple: new THREE.MeshStandardMaterial({ color: '#6950a2', roughness: 0.94 }),
    cuff: new THREE.MeshStandardMaterial({ color: '#a02e67', roughness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: '#ffcd34', metalness: 0.22, roughness: 0.45 }),
    white: new THREE.MeshStandardMaterial({ color: '#fff6e8', roughness: 0.25 }),
    iris: new THREE.MeshStandardMaterial({ color: '#763716', roughness: 0.32 }),
    pupil: new THREE.MeshStandardMaterial({ color: '#160d0b', roughness: 0.25 }),
    shine: new THREE.MeshBasicMaterial({ color: '#fff9ed' }),
  }
  const sphere = new THREE.SphereGeometry(1, 28, 20)
  function ellipsoid(parent, material, position, scale) {
    const mesh = new THREE.Mesh(sphere, materials[material])
    mesh.position.set(...position)
    mesh.scale.set(...scale)
    parent.add(mesh)
    return mesh
  }
  function curve(parent, material, points, radius = 0.022) {
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 20, radius, 6, false)
    const mesh = new THREE.Mesh(geometry, materials[material])
    parent.add(mesh)
    return mesh
  }
  const torso = new THREE.Group()
  root.add(torso)
  ellipsoid(torso, 'black', [0, 1.71, 0], [0.49, 0.68, 0.3])
  ellipsoid(torso, 'black', [0, 2.17, 0], [0.23, 0.21, 0.21])
  ellipsoid(torso, 'red', [0.39, 2, 0.06], [0.18, 0.24, 0.26])
  curve(torso, 'seam', [[-0.37, 2.03, 0.17], [0, 1.91, 0.315], [0.39, 1.99, 0.22]])
  curve(torso, 'seam', [[-0.4, 1.64, 0.17], [0, 1.77, 0.318], [0.34, 2.07, 0.19]], 0.017)
  curve(torso, 'red', [[-0.26, 1.26, 0.2], [-0.19, 1.39, 0.28], [-0.1, 1.56, 0.31]], 0.027)
  ellipsoid(torso, 'black', [0, 1.22, 0], [0.48, 0.12, 0.31])
  const waist = new THREE.Group()
  root.add(waist)
  ellipsoid(waist, 'cuff', [0, 1.08, 0], [0.49, 0.16, 0.32])
  curve(waist, 'purple', [[-0.01, 1.16, 0.31], [-0.14, 1.03, 0.37], [-0.12, 0.93, 0.34], [0, 1.06, 0.34], [0.13, 0.99, 0.35], [0.16, 1.11, 0.34], [0, 1.16, 0.32]], 0.026)
  curve(waist, 'purple', [[0, 1.06, 0.34], [-0.035, 0.8, 0.32], [-0.09, 0.7, 0.28]], 0.024)

  const legs = [-1, 1].map((side) => {
    const leg = new THREE.Group()
    leg.position.set(side * 0.255, 0.98, 0)
    root.add(leg)
    ellipsoid(leg, 'purple', [side * 0.055, -0.27, 0], [0.29, 0.44, 0.29])
    curve(leg, 'seam', [[side * 0.24, -0.01, 0.12], [side * 0.28, -0.28, 0.14], [side * 0.19, -0.57, 0.16]], 0.012)
    ellipsoid(leg, 'cuff', [side * 0.09, -0.63, 0], [0.19, 0.19, 0.2])
    curve(leg, 'seam', [[-0.05, -0.62, 0.17], [side * 0.08, -0.66, 0.21], [0.21, -0.62, 0.16]], 0.025)
    ellipsoid(leg, 'skin', [side * 0.12, -0.82, 0.12], [0.23, 0.12, 0.32])
    for (let i = 0; i < 4; i++) ellipsoid(leg, 'skin', [side * 0.12 - 0.12 + i * 0.08, -0.84, 0.36], [0.049, 0.065, 0.09])
    return leg
  })
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.48, 2.03, 0)
    torso.add(arm)
    ellipsoid(arm, side === 1 ? 'red' : 'skin', [side * 0.06, -0.24, 0], [0.155, 0.3, 0.17])
    ellipsoid(arm, 'black', [side * 0.08, -0.6, 0.02], [0.16, 0.26, 0.17])
    if (side === 1) {
      curve(arm, 'seam', [[-0.06, 0.02, 0.12], [0.13, -0.19, 0.17], [-0.02, -0.45, 0.16], [0.2, -0.67, 0.12]], 0.035)
    } else curve(arm, 'seam', [[-0.2, -0.38, 0.06], [0, -0.54, 0.18], [-0.17, -0.7, 0.1]], 0.028)
    const hand = ellipsoid(arm, 'skin', [side * 0.08, -0.86, 0.04], [0.14, 0.16, 0.12])
    ellipsoid(arm, 'black', [side * 0.08, -0.79, -0.005], [0.15, 0.1, 0.13])
    ellipsoid(arm, 'skin', [side * -0.04, -0.85, 0.1], [0.066, 0.1, 0.07])
    arm.rotation.z = side * 0.1
    return { arm, hand }
  })

  const head = new THREE.Group()
  head.name = 'DaniVexHead'
  head.position.set(0, 2.76, 0)
  torso.add(head)
  ellipsoid(head, 'skin', [0, -0.02, 0], [0.7, 0.72, 0.58])
  ellipsoid(head, 'skin', [0, -0.36, 0.08], [0.49, 0.34, 0.43])
  for (const side of [-1, 1]) {
    ellipsoid(head, 'skin', [side * 0.66, -0.08, 0], [0.17, 0.24, 0.13])
    ellipsoid(head, 'ear', [side * 0.7, -0.07, 0.09], [0.075, 0.145, 0.035])
  }
  ellipsoid(head, 'hair', [0, 0.17, -0.1], [0.73, 0.58, 0.54])
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lock = ellipsoid(head, 'hair', [side * (0.59 - i * 0.055), 0.12 - i * 0.1, 0.23 + i * 0.06], [0.095, 0.28, 0.1])
      lock.rotation.z = side * -0.38
    }
  }
  const fringe = ellipsoid(head, 'hair', [-0.26, 0.4, 0.49], [0.29, 0.13, 0.115])
  fringe.rotation.z = 0.38
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group()
    eye.name = `DaniVexEye${side}`
    eye.position.set(side * 0.27, -0.055, 0.506)
    eye.rotation.y = side * 0.18
    head.add(eye)
    ellipsoid(eye, 'hair', [0, 0.015, 0], [0.216, 0.26, 0.068])
    ellipsoid(eye, 'white', [0, 0, 0.025], [0.197, 0.228, 0.065])
    const pupil = new THREE.Group()
    eye.add(pupil)
    ellipsoid(pupil, 'iris', [0.015 * -side, -0.01, 0.083], [0.127, 0.174, 0.041])
    ellipsoid(pupil, 'pupil', [0.015 * -side, 0.01, 0.114], [0.07, 0.119, 0.014])
    ellipsoid(pupil, 'shine', [-0.04, 0.085, 0.13], [0.04, 0.044, 0.01])
    ellipsoid(pupil, 'shine', [0.055, -0.06, 0.122], [0.017, 0.022, 0.008])
    const brow = curve(head, 'hair', [[side * 0.11, 0.27, 0.51], [side * 0.27, 0.3, 0.54], [side * 0.44, 0.26, 0.44]], 0.027)
    return { eye, pupil, brow }
  })
  ellipsoid(head, 'skin', [0, -0.24, 0.559], [0.067, 0.077, 0.067])
  const smile = curve(head, 'hair', [[-0.2, -0.405, 0.444], [-0.08, -0.449, 0.466], [0.075, -0.442, 0.47], [0.19, -0.397, 0.443]], 0.012)

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2 + 0.13), materials.black)
  cap.position.set(0, 0.34, -0.02)
  cap.scale.set(1, 0.75, 0.92)
  head.add(cap)
  const brim = ellipsoid(head, 'black', [0, 0.335, 0.49], [0.83, 0.052, 0.48])
  brim.rotation.x = 0.055
  curve(head, 'seam', [[-0.67, 0.31, 0.39], [-0.52, 0.315, 0.82], [0, 0.315, 0.94], [0.52, 0.315, 0.82], [0.67, 0.31, 0.39]], 0.009)
  ellipsoid(head, 'black', [0, 0.935, -0.02], [0.06, 0.027, 0.06])
  const letter = new THREE.Shape()
  letter.moveTo(-0.15, 0); letter.lineTo(-0.15, 0.37); letter.lineTo(0.045, 0.37)
  letter.quadraticCurveTo(0.24, 0.36, 0.24, 0.185); letter.quadraticCurveTo(0.24, 0, 0.045, 0); letter.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-0.05, 0.09); hole.lineTo(0.03, 0.09); hole.quadraticCurveTo(0.135, 0.09, 0.135, 0.185)
  hole.quadraticCurveTo(0.135, 0.28, 0.03, 0.28); hole.lineTo(-0.05, 0.28); hole.closePath()
  letter.holes.push(hole)
  const d = new THREE.Mesh(new THREE.ExtrudeGeometry(letter, { depth: 0.017, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, steps: 1 }), materials.gold)
  d.position.set(-0.04, 0.43, 0.74)
  d.rotation.x = -0.3
  head.add(d)

  let previousAction = ''
  let actionStart = 0
  let lookX = 0
  let lookY = 0
  return {
    root,
    update({ time, delta, action, pointer, motion }) {
      if (action !== previousAction) { previousAction = action; actionStart = time }
      const phase = time - actionStart
      const m = motion ? 1 : 0
      const blend = 1 - Math.exp(-delta * 8)
      lookX += (THREE.MathUtils.clamp(pointer.x || 0, -1, 1) * 0.23 * m - lookX) * blend
      lookY += (THREE.MathUtils.clamp(pointer.y || 0, -1, 1) * 0.1 * m - lookY) * blend
      const happy = ['HAPPY', 'CELEBRATE'].includes(action)
      const waving = ['WAVE', 'RETURN'].includes(action)
      const sleepy = action === 'SLEEPY'
      const surprised = action === 'SURPRISED'
      const bored = action === 'BORED'
      const blinkTime = time % 5.7
      const blink = motion && blinkTime > 5.45 ? Math.max(0.06, Math.abs(blinkTime - 5.575) / 0.125) : 1
      eyes.forEach(({ eye, pupil, brow }) => {
        eye.scale.y = sleepy ? 0.45 : blink * (surprised ? 1.1 : 1)
        brow.position.y += ((surprised ? 0.045 : bored ? -0.015 : 0) - brow.position.y) * blend
        pupil.position.x = lookX * 0.18
        pupil.position.y = -lookY * 0.15
      })
      torso.position.y = m * (Math.sin(time * 1.8) * 0.016 + (happy ? Math.max(0, Math.sin(phase * 6)) * 0.075 : 0))
      torso.rotation.z = m * (Math.sin(time * 0.8) * 0.016 + (action === 'CURIOUS' ? 0.025 : 0))
      head.rotation.y = lookX + (['POINT_LEFT', 'LOOK'].includes(action) ? -0.14 : action === 'POINT_RIGHT' ? 0.14 : bored ? Math.sin(phase * 1.6) * 0.17 * m : 0)
      head.rotation.x = lookY + (sleepy ? 0.14 + Math.sin(phase * 1.4) * 0.035 * m : surprised ? -0.09 : 0)
      head.rotation.z = action === 'CURIOUS' ? -0.1 : action === 'THINKING' ? 0.07 : Math.sin(time * 0.7) * 0.016 * m
      smile.scale.y = happy ? 1.03 : 1
      const rightTarget = waving ? 2.65 + Math.sin(phase * 12) * 0.2 * m
        : happy ? 1.45 : action === 'POINT_RIGHT' ? 1.35 : action === 'THINKING' ? 2.1 : surprised ? 0.55 : bored ? 0.16 + Math.sin(phase * 2) * 0.05 * m : 0.12
      const leftTarget = action === 'POINT_LEFT' ? -1.35 : happy ? -0.7 : surprised ? -0.55 : -0.1
      arms[1].arm.rotation.z += (rightTarget - arms[1].arm.rotation.z) * blend
      arms[0].arm.rotation.z += (leftTarget - arms[0].arm.rotation.z) * blend
      arms[1].hand.scale.y = waving ? 0.2 : 0.16
      legs.forEach((leg, i) => { leg.rotation.x = action === 'MOVE_SIDE' ? Math.sin(phase * 12 + i * Math.PI) * 0.2 * m : 0 })
      root.rotation.y = -0.07
    },
    dispose() { disposeObject(root) },
  }
}

export function disposeObject(root) {
  const resources = new Set()
  root.traverse((object) => {
    if (object.geometry) resources.add(object.geometry)
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach((material) => {
      resources.add(material)
      Object.values(material).forEach((value) => { if (value?.isTexture) resources.add(value) })
    })
    if (object.skeleton) resources.add(object.skeleton)
  })
  resources.forEach((resource) => resource.dispose())
}

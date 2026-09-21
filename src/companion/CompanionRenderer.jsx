import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createCompanionLighting } from './lighting.js'
import { loadCharacter } from './loadCharacter.js'
import { getCompanionFraming } from './framing.js'

export default function CompanionRenderer({ action, pointer, motion, active, framing = 'full', onUnavailable, onReady }) {
  const canvasRef = useRef(null)
  const runtime = useRef(null)

  useEffect(() => {
    const host = canvasRef.current
    const canvas = document.createElement('canvas')
    canvas.className = 'companion-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)
    let renderer
    try {
      const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
      if (!context || context.isContextLost()) { canvas.remove(); onUnavailable(); return undefined }
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch { canvas.remove(); onUnavailable(); return undefined }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    const scene = new THREE.Scene()
    const disposeLighting = createCompanionLighting(renderer, scene)
    const camera = new THREE.OrthographicCamera(-1.8, 1.8, 4, -0.2, 0.1, 30)
    camera.position.set(0, 1.9, 9)
    camera.lookAt(0, 1.9, 0)
    let cancelled = false
    let character = null
    let raf = 0
    let last = 0
    let elapsed = 0
    let props = { action: 'INTRO', pointer, motion: false, active: false, framing: 'full' }
    let aspect = 1
    let currentFraming = null
    // Subtle camera parallax toward the pointer — depth without moving the model.
    // Snapped to 0 whenever motion is off (paused / reduced-motion / headless QA never
    // moves the mouse), so it never affects reduced-motion pixel stability or framing.
    const parallax = { x: 0, y: 0 }
    const updateCamera = (delta, snap = false) => {
      const target = getCompanionFraming(props.framing, aspect)
      if (!currentFraming || snap || !props.motion) currentFraming = target
      else {
        for (const key of Object.keys(target)) currentFraming[key] = THREE.MathUtils.damp(currentFraming[key], target[key], 14, delta)
      }
      if (!props.motion) { parallax.x = 0; parallax.y = 0 }
      else {
        parallax.x = THREE.MathUtils.damp(parallax.x, THREE.MathUtils.clamp(props.pointer.current?.x || 0, -1, 1) * 0.09, 3, delta)
        parallax.y = THREE.MathUtils.damp(parallax.y, THREE.MathUtils.clamp(props.pointer.current?.y || 0, -1, 1) * -0.06, 3, delta)
      }
      camera.position.set(currentFraming.centerX + parallax.x, currentFraming.centerY + parallax.y, 9)
      camera.lookAt(currentFraming.centerX, currentFraming.centerY, 0)
      for (const key of ['left', 'right', 'top', 'bottom']) camera[key] = currentFraming[key]
      camera.updateProjectionMatrix()
      canvas.dataset.framing = props.framing
    }
    const render = (now) => {
      raf = 0
      if (cancelled || !character) return
      if (props.active) {
        const targetFrame = window.innerWidth < 700 ? 50 : 1000 / 30
        if (now - last >= targetFrame || !props.motion) {
          const delta = Math.min((now - last) / 1000, 0.075)
          last = now
          elapsed += props.motion ? delta : 0
          character.update({ time: elapsed, delta: props.motion ? delta : 1, action: props.action, pointer: props.pointer.current, motion: props.motion })
          updateCamera(delta)
          renderer.render(scene, camera)
          canvas.dataset.rendered = 'true'
        }
        if (props.motion) raf = requestAnimationFrame(render)
      }
    }
    const kick = () => { cancelAnimationFrame(raf); last = performance.now() - 60; raf = requestAnimationFrame(render) }
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      aspect = width / height
      updateCamera(0, true)
      kick()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const lost = (event) => { event.preventDefault(); cancelAnimationFrame(raf); onUnavailable() }
    canvas.addEventListener('webglcontextlost', lost)
    runtime.current = { update(next) { props = next; kick() } }
    loadCharacter().then((loaded) => {
      if (cancelled) { loaded.dispose(); return }
      character = loaded
      scene.add(character.root)
      resize()
      onReady()
    }).catch(() => { if (!cancelled) onUnavailable() })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      character?.dispose()
      disposeLighting()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      runtime.current = null
    }
  }, [onUnavailable, onReady, pointer])

  useEffect(() => { runtime.current?.update({ action, pointer, motion, active, framing }) }, [action, pointer, motion, active, framing])

  return <div ref={canvasRef} aria-hidden="true" className="companion-canvas" />
}

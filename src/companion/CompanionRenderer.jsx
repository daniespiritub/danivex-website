import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { loadCharacter } from './loadCharacter.js'

export default function CompanionRenderer({ action, pointer, motion, active, onUnavailable, onReady }) {
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
    renderer.toneMappingExposure = 1.3
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xfff3e4, 0x716780, 2.25))
    const key = new THREE.DirectionalLight(0xfff0d6, 3.2)
    key.position.set(-3, 5, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xa5c7ff, 2)
    rim.position.set(3, 3, -3)
    scene.add(rim)
    const camera = new THREE.OrthographicCamera(-1.8, 1.8, 4, -0.2, 0.1, 30)
    camera.position.set(0, 1.9, 9)
    camera.lookAt(0, 1.9, 0)
    let cancelled = false
    let character = null
    let raf = 0
    let last = 0
    let elapsed = 0
    let props = { action: 'INTRO', pointer, motion: false, active: false }
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
      const span = 4.25
      camera.left = -span * width / height / 2
      camera.right = span * width / height / 2
      camera.top = span / 2
      camera.bottom = -span / 2
      camera.updateProjectionMatrix()
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
    }).catch(onUnavailable)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      character?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      runtime.current = null
    }
  }, [onUnavailable, onReady, pointer])

  useEffect(() => { runtime.current?.update({ action, pointer, motion, active }) }, [action, pointer, motion, active])

  return <div ref={canvasRef} aria-hidden="true" className="companion-canvas" />
}

import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { PiPauseBold, PiPlayBold, PiMinusBold, PiHandWavingBold } from 'react-icons/pi'
import { useCompanionController } from './useCompanionController.js'
import { useCompanionPosition } from './useCompanionPosition.js'
import './companion.css'

const Renderer = lazy(() => import('./CompanionRenderer.jsx'))

class CompanionBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

function Companion() {
  const { state, dispatch, preferences, setPreferences, reduced, visible, pointer, interact } = useCompanionController()
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const onUnavailable = useCallback(() => setUnavailable(true), [])
  const onReady = useCallback(() => dispatch({ type: 'READY' }), [dispatch])
  const position = useCompanionPosition({ minimized: Boolean(preferences.minimized || unavailable), dispatch })
  const lang = document.documentElement.lang.slice(0, 2)
  const labels = {
    es: { greet: 'Saludar a DaniVex', pause: 'Pausar movimientos', play: 'Activar movimientos', hide: 'Minimizar Companion', show: 'Mostrar Companion' },
    pt: { greet: 'Cumprimentar DaniVex', pause: 'Pausar movimentos', play: 'Ativar movimentos', hide: 'Minimizar Companion', show: 'Mostrar Companion' },
    en: { greet: 'Say hello to DaniVex', pause: 'Pause motion', play: 'Enable motion', hide: 'Minimize Companion', show: 'Show Companion' },
  }[lang] || { greet: 'Say hello to DaniVex', pause: 'Pause motion', play: 'Enable motion', hide: 'Minimize Companion', show: 'Show Companion' }
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 650)
    return () => window.clearTimeout(timer)
  }, [])

  const docked = position.mode === 'dock'
  const hidden = position.mode === 'hidden'
  const paused = Boolean(preferences.paused || reduced)
  function toggle(key) { setPreferences((current) => ({ ...current, [key]: !current[key] })) }

  return (
    <div data-companion-root data-mode={position.mode} data-state={state.action}
      data-travel={Boolean(position.animate)}
      data-motion={paused ? 'paused' : 'active'} className="danivex-companion"
      aria-hidden={hidden || undefined}
      style={{ width: position.width || 1, height: position.height || 1,
        transform: `translate3d(${position.left}px, ${position.top}px, 0)`, visibility: hidden ? 'hidden' : 'visible' }}>
      {docked ? (
        <button className="companion-dock-button" type="button" title={preferences.minimized ? labels.show : labels.greet} aria-label={preferences.minimized ? labels.show : labels.greet}
          onClick={() => { setPreferences((current) => ({ ...current, minimized: false })); interact() }}>
          <PiHandWavingBold aria-hidden="true" />
        </button>
      ) : (
        <>
          <button className="companion-hit" type="button" aria-label={labels.greet} title={labels.greet} onClick={interact} />
          <div className="companion-controls">
            <button type="button" onClick={() => toggle('paused')} aria-label={preferences.paused ? labels.play : labels.pause}
              title={preferences.paused ? labels.play : labels.pause} aria-pressed={Boolean(preferences.paused)}>
              {preferences.paused ? <PiPlayBold aria-hidden="true" /> : <PiPauseBold aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => toggle('minimized')} aria-label={labels.hide} title={labels.hide}>
              <PiMinusBold aria-hidden="true" />
            </button>
          </div>
        </>
      )}
      <div className="companion-stage" style={{ display: docked ? 'none' : undefined }}>
        {ready && !unavailable && !preferences.minimized && (
          <Suspense fallback={null}>
            <Renderer action={state.action} pointer={pointer} motion={!paused}
              active={visible && !hidden && !docked} onUnavailable={onUnavailable} onReady={onReady} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default function DaniVexCompanion() {
  return <CompanionBoundary><Companion /></CompanionBoundary>
}

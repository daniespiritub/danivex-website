import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { COMPANION_EVENT } from './config.js'
import { actionDuration, companionReducer, initialCompanionState } from './machine.js'

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem('danivex:companion') || '{}')
    return { paused: value?.paused === true, minimized: value?.minimized === true }
  } catch { return {} }
}

export function useCompanionController() {
  const [state, dispatch] = useReducer(companionReducer, initialCompanionState)
  const [preferences, setPreferences] = useState(readPreferences)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(() => !document.hidden)
  const taps = useRef({ count: 0, last: 0 })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReduced(query.matches)
    const updateVisibility = () => setVisible(!document.hidden)
    query.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      query.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('danivex:companion', JSON.stringify(preferences)) } catch { /* Optional preference. */ }
  }, [preferences])

  useEffect(() => {
    if (state.busy || !visible || preferences.paused) return undefined
    const duration = actionDuration[state.action]
    if (!duration) return undefined
    const timer = window.setTimeout(() => dispatch({ type: 'FINISH', revision: state.revision }), duration)
    return () => window.clearTimeout(timer)
  }, [state, visible, preferences.paused])

  useEffect(() => {
    let lastReaction = 0
    let lastActive = Date.now()
    let inactivityStage = 0
    const onEvent = ({ detail }) => {
      if (!detail?.type) return
      const now = Date.now()
      if (detail.type === 'CHANGE' && now - lastReaction < 2200) return
      lastReaction = now
      dispatch({ type: detail.type })
    }
    const activity = (event) => {
      lastActive = Date.now()
      if (inactivityStage) { dispatch({ type: 'ACTIVITY' }); inactivityStage = 0 }
      if (event.type === 'pointermove' && event.pointerType === 'mouse') {
        pointer.current = { x: event.clientX / window.innerWidth * 2 - 1, y: event.clientY / window.innerHeight * 2 - 1 }
      }
    }
    const interval = window.setInterval(() => {
      if (document.hidden || preferences.paused || reduced) return
      const idle = Date.now() - lastActive
      const stage = idle > 85000 ? 2 : idle > 35000 ? 1 : 0
      if (stage > inactivityStage) {
        dispatch({ type: 'INACTIVE', sleepy: stage === 2 })
        inactivityStage = stage
      }
    }, 5000)
    window.addEventListener(COMPANION_EVENT, onEvent)
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll']
    events.forEach((type) => window.addEventListener(type, activity, { passive: true }))
    return () => {
      window.removeEventListener(COMPANION_EVENT, onEvent)
      events.forEach((type) => window.removeEventListener(type, activity))
      window.clearInterval(interval)
    }
  }, [preferences.paused, reduced])

  const interact = useCallback(() => {
    const now = Date.now()
    taps.current.count = now - taps.current.last < 900 ? taps.current.count + 1 : 1
    taps.current.last = now
    dispatch({ type: taps.current.count >= 4 ? 'MANY_TAPS' : 'TAP', index: taps.current.count - 1 })
  }, [])

  return { state, dispatch, preferences, setPreferences, reduced, visible, pointer, interact }
}

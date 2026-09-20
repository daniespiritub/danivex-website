import { useEffect, useState, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { AccountContext } from './context.js'
import { request } from './api.js'

async function loadState(signal) {
    const config = await request('auth', 'config', undefined, signal)
    let user = null
    if (config.account) {
      try { user = (await request('auth', 'session', undefined, signal)).user } catch (error) {
        if (error.name === 'AbortError') throw error
        if (error.message !== 'authentication_required') throw error
      }
    }
    return { ...config, ready: true, user }
}

export default function AccountProvider({ children }) {
  const [state, setState] = useState({ ready: false, account: false, assistant: false, user: null })
  const pending = useRef(null)
  const refresh = useCallback(async () => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    try {
      const value = await loadState(controller.signal)
      if (!controller.signal.aborted) setState(value)
    } catch (error) {
      if (!controller.signal.aborted) setState({ ready: true, account: false, assistant: false, user: null })
      throw error
    }
  }, [])
  useEffect(() => {
    const reload = () => { refresh().catch(() => {}) }
    const invalidate = () => { setState((current) => ({ ...current, user: null })) }
    // Remove private React state before a page is put in the back-forward cache.
    const hide = () => { pending.current?.abort(); flushSync(() => setState((current) => ({ ...current, ready: false, user: null }))) }
    const show = (event) => { if (event.persisted) reload() }
    reload()
    window.addEventListener('danivex:session-invalid', invalidate)
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', show)
    window.addEventListener('focus', reload)
    return () => {
      pending.current?.abort()
      window.removeEventListener('danivex:session-invalid', invalidate)
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('pageshow', show)
      window.removeEventListener('focus', reload)
    }
  }, [refresh])
  return <AccountContext.Provider value={{ ...state, refresh }}>{children}</AccountContext.Provider>
}

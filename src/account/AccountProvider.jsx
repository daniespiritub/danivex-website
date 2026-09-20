import { useEffect, useState, useCallback } from 'react'
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
  const refresh = useCallback(async () => { setState(await loadState()) }, [])
  useEffect(() => {
    const controller = new AbortController()
    loadState(controller.signal).then((value) => { if (!controller.signal.aborted) setState(value) }).catch(() => { if (!controller.signal.aborted) setState({ ready: true, account: false, assistant: false, user: null }) })
    return () => controller.abort()
  }, [])
  return <AccountContext.Provider value={{ ...state, refresh }}>{children}</AccountContext.Provider>
}

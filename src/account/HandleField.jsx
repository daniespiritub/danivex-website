import { useEffect, useId, useRef, useState } from 'react'
import { request } from './api.js'

export default function HandleField({ t, initial = '' }) {
  const hint = useId()
  const pending = useRef(null)
  const [value, setValue] = useState(initial.toLowerCase())
  const [status, setStatus] = useState('')
  useEffect(() => () => pending.current?.abort(), [])
  async function check(event) {
    if (!event.currentTarget.validity.valid) return
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setStatus('loading')
    try {
      const result = await request('account', 'handle-availability', { handle: value }, controller.signal)
      if (!controller.signal.aborted) setStatus(result.available ? 'handleAvailable' : 'handleTaken')
    } catch (error) {
      if (!controller.signal.aborted) setStatus(error.message === 'invalid_handle' ? 'handleTaken' : 'handleCheckFailed')
    }
  }
  return <label>{t.handle}<input name="handle" aria-label={t.handle} value={value} onChange={(event) => {
    pending.current?.abort(); setValue(event.target.value.toLowerCase()); setStatus('')
  }} onBlur={check} required pattern="[a-z0-9_]{3,16}" minLength="3" maxLength="16" autoComplete="username" autoCapitalize="none" spellCheck="false" aria-describedby={hint} />
    <span id={hint} className="account-muted" role="status">{status ? t[status] : t.handleHelp}</span>
  </label>
}

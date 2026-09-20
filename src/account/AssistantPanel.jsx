import { useState } from 'react'
import { PiPaperPlaneRightBold } from 'react-icons/pi'
import { useAccount } from './context.js'
import { request } from './api.js'
import { accountCopy } from './copy.js'

export default function AssistantPanel({ language = 'es' }) {
  const { user, ready } = useAccount()
  return <AssistantContent key={ready ? user?.email || 'anonymous' : 'loading'} language={language} />
}

function AssistantContent({ language }) {
  const { assistant, user } = useAccount()
  const t = accountCopy[language]
  const [messages, setMessages] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!assistant) return <p role="status">{t.noAssistant}</p>
  async function send(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    setBusy(true); setError('')
    try {
      const result = await request('assistant', 'respond', { message: data.message, language, page: window.location.pathname.startsWith('/account') ? '/account' : window.location.pathname, private_context: data.private_context === 'on', save: data.save === 'on' })
      setMessages((current) => [...current.slice(-9), { question: data.message, ...result }])
      form.elements.message.value = ''
    } catch { setError(t.assistantUnavailable) } finally { setBusy(false) }
  }
  return <div className="assistant-content">
    <p className="account-muted">{t.assistantNotice} <a href="/privacy">{t.privacy}</a></p>
    <div className="assistant-messages" role="log" aria-live="polite">{messages.map((item, index) => <div className="assistant-exchange" key={index}>
      <p className="assistant-question">{item.question}</p><p>{item.answer}</p>
      <ul>{item.sources.map((source) => <li key={source.url}><a href={source.url}>{source.title}</a></li>)}</ul>
    </div>)}</div>
    <form onSubmit={send} className="account-form">
      <label>{t.message}<textarea name="message" required maxLength="2000" rows="3" disabled={busy} /></label>
      {user?.handle && <label className="account-check"><input type="checkbox" name="private_context" />{t.privateContext}</label>}
      {user?.chat_history_enabled && <label className="account-check"><input type="checkbox" name="save" />{t.storeChat}</label>}
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}><PiPaperPlaneRightBold aria-hidden="true" />{busy ? t.loading : t.send}</button>
    </form>
    <p><a href={user ? '/account/support' : '/#contacto'}>{t.support}</a></p>
  </div>
}

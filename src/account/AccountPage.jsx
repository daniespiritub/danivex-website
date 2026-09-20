import { useEffect, useState } from 'react'
import { PiHouseBold, PiHeartBold, PiBookmarkSimpleBold, PiDownloadSimpleBold, PiChatCircleDotsBold, PiLifebuoyBold, PiGearBold, PiSignOutBold, PiTrashBold, PiClockCounterClockwiseBold } from 'react-icons/pi'
import { FaGoogle, FaApple } from 'react-icons/fa'
import SiteNav from '../components/SiteNav.jsx'
import { useAccount } from './context.js'
import { request } from './api.js'
import { initialLanguage, accountCopy } from './copy.js'
import AssistantPanel from './AssistantPanel.jsx'
import HandleField from './HandleField.jsx'
import './account.css'

const sections = [ ['overview', PiHouseBold], ['favorites', PiHeartBold], ['saved', PiBookmarkSimpleBold], ['downloads', PiDownloadSimpleBold], ['activity', PiClockCounterClockwiseBold], ['assistant', PiChatCircleDotsBold], ['support', PiLifebuoyBold], ['settings', PiGearBold] ]
const resourceLabels = { sensitivity: 'Sensibilidad FF', scanner: 'Player Scanner', mobilador: 'DaniVex Mobilador' }
const resourceLinks = { sensitivity: '/#sensibilidad', scanner: '/player-scanner', mobilador: '/#mobilador' }

export default function AccountPage() {
  const { user } = useAccount()
  return <AccountSurface key={window.location.pathname.startsWith('/account') ? user?.email || 'anonymous' : 'auth'} />
}

function AccountSurface() {
  const account = useAccount()
  const [language, setLanguage] = useState(initialLanguage)
  const t = accountCopy[language]
  const path = window.location.pathname.replace(/\/$/, '')
  const section = path.split('/')[2] || 'overview'
  const isAccount = path.startsWith('/account')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).has('auth_error') ? 'authentication_failed' : '')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState(null)
  const [revision, setRevision] = useState(0)
  const [confirm] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return { token_hash: p.get('token_hash'), type: p.get('type') }
  })
  const [recovery, setRecovery] = useState(false)
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('danivex:language', language) } catch { /* Optional. */ }
  }, [language])
  useEffect(() => {
    if (path === '/auth/confirm') window.history.replaceState(null, '', path)
  }, [path])
  useEffect(() => {
    if (!isAccount || !account.user?.handle || ['settings', 'assistant'].includes(section)) return undefined
    const controller = new AbortController()
    request('account', section, undefined, controller.signal).then(setData).catch((e) => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [isAccount, account.user?.handle, section, revision])

  async function perform(fn) {
    setBusy(true); setFeedback(''); setError('')
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const fields = (event) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)) }
  async function authAction(action, input) {
    const result = await request('auth', action, input)
    if (result.url) window.location.assign(result.url)
    else if (result.signedOut) window.location.assign('/signin')
    else if (result.message) setFeedback(t.checkEmail)
    else if (action === 'confirm' && result.recovery) { await account.refresh(); setRecovery(true) }
    else if (['signin', 'confirm'].includes(action)) window.location.assign('/account')
    else setFeedback(t.done)
  }
  const passwordInput = <label>{t.password}<input type="password" name="password" required minLength={path === '/register' ? 12 : 1} maxLength="128" autoComplete={path === '/register' ? 'new-password' : 'current-password'} /></label>
  const emailInput = <label>{t.email}<input type="email" name="email" required maxLength="254" autoComplete="email" /></label>
  const feedbackNode = <>{feedback && <p role="status" className="account-notice">{feedback}</p>}{error && <div role="alert" className="account-error"><p>{error === 'reauthentication_required' ? <>{t.relogin} <a href="/signin">{t.signin}</a></> : error === 'invalid_handle' || error === 'already_exists' ? `${t.error} ${t.handleHelp}` : t.error}</p>{isAccount && <button className="account-secondary" disabled={busy} onClick={() => { setError(''); setRevision((n) => n + 1) }}>{t.retry}</button>}</div>}</>
  function remove(collection, id) { perform(async () => { await request('account', 'remove', { collection, id }); setRevision((n) => n + 1) }) }
  async function signout() {
    try { await request('auth', 'signout', {}) } finally { await account.refresh() }
    window.location.assign('/')
  }

  let content
  if (!account.ready) content = <p role="status">{t.loading}</p>
  else if (!account.account) content = <><h1>{t.account}</h1><p>{t.unavailable}</p><a href="/">{t.home}</a></>
  else if (!isAccount) {
    const mode = path === '/register' ? 'signup' : path === '/reset-password' ? 'reset' : 'signin'
    if (path === '/auth/confirm') content = <div className="auth-surface"><h1>{recovery ? t.recovery : t.confirmLink}</h1>{feedbackNode}
      {recovery ? <form className="account-form" onSubmit={(event) => { const input = fields(event); perform(() => authAction('password', input)) }}>
        <label>{t.newPassword}<input name="password" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /></label><button className="btn btn-primary" disabled={busy}>{t.save}</button><a href="/account">{t.account}</a>
      </form> : <button className="btn btn-primary" disabled={busy || !confirm.token_hash} onClick={() => perform(() => authAction('confirm', confirm))}>{busy ? t.loading : t.confirmLink}</button>}
    </div>
    else content = <div className="auth-surface"><h1>{mode === 'signup' ? t.register : mode === 'reset' ? t.reset : t.signin}</h1>
      {mode !== 'reset' && <div className="oauth-actions">{[['google', FaGoogle], ['apple', FaApple]].filter(([provider]) => account[provider]).map(([provider, Icon]) => <button key={provider} className="account-secondary" disabled={busy} onClick={() => perform(() => authAction('oauth', { provider }))}><Icon aria-hidden="true" />{provider === 'google' ? 'Google' : 'Apple'}</button>)}</div>}
      <form className="account-form" onSubmit={(event) => { const input = fields(event); perform(() => authAction(mode, input)) }}>{emailInput}{mode !== 'reset' && passwordInput}
        {mode === 'signup' && <label className="account-check"><input type="checkbox" required /> <a href="/privacy" target="_blank" rel="noreferrer">{t.privacy}</a></label>}
        <button className="btn btn-primary" disabled={busy}>{busy ? t.loading : t.submit}</button>
      </form>{feedbackNode}
      <div className="auth-links"><a href={mode === 'signup' ? '/signin' : '/register'}>{mode === 'signup' ? t.signin : t.register}</a><a href="/reset-password">{t.reset}</a></div>
    </div>
  } else if (!account.user) content = <><h1>{t.account}</h1><a className="btn btn-primary" href="/signin">{t.signin}</a></>
  else if (!account.user.handle) content = <div className="auth-surface"><h1>{t.chooseHandle}</h1><p>{t.handleHelp}</p><form className="account-form" onSubmit={(event) => { const input = fields(event); perform(async () => { await request('account', 'profile', { handle: input.handle }); await account.refresh() }) }}>
    <HandleField t={t} /><button className="btn btn-primary" disabled={busy}>{t.submit}</button>
  </form>{feedbackNode}</div>
  else {
    let panel
    if (section === 'overview') panel = <>
      <h1>@{account.user.handle}</h1>
      <div className="account-stats">{['favorites', 'saved', 'downloads'].map((key) => <a key={key} href={`/account/${key}`}><strong>{data?.counts?.[key] ?? '—'}</strong><span>{t[key]}</span></a>)}</div>
      <div className="account-list">{(data?.resources || []).map((resource) => <div className="account-row" key={resource.id}><a href={resource.href}>{resource.title}</a><button className="account-icon" title={t.favorite} aria-label={`${t.favorite}: ${resource.title}`} disabled={busy} onClick={() => perform(async () => { await request('account', 'favorite', { resource_id: resource.id }); setFeedback(t.done); setRevision((n) => n + 1) })}><PiHeartBold /></button></div>)}</div>
      <h2><a href="/account/activity">{t.activity}</a></h2>{!data?.activity?.length ? <p>{t.empty}</p> : <ul className="account-list">{data.activity.map((item) => <li className="account-row" key={item.id}><span>{t.events[item.kind] || t.activity}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(language)}</time></li>)}</ul>}
    </>
    else if (section === 'settings') panel = <>
      <h1>{t.settings}</h1>
      <dl className="account-details"><dt>{t.email}</dt><dd>{account.user.email}</dd><dt>{t.created}</dt><dd>{new Date(account.user.created_at).toLocaleDateString(language)}</dd><dt>{t.providers}</dt><dd>{account.user.providers.join(', ')}</dd></dl>
      <form className="account-form" onSubmit={(event) => { const input = fields(event); perform(async () => { await request('account', 'profile', { handle: input.handle, language, chat_history_enabled: input.history === 'on' }); await account.refresh(); setFeedback(t.done) }) }}>
        <HandleField t={t} initial={account.user.handle} />
        <label className="account-check"><input type="checkbox" name="history" defaultChecked={account.user.chat_history_enabled} />{t.history}</label>
        <button className="btn btn-primary" disabled={busy}>{t.save}</button>
      </form>
      {account.linking && <div className="oauth-actions">{['google', 'apple'].filter((provider) => account[provider] && !account.user.providers.includes(provider)).map((provider) => <button key={provider} className="account-secondary" disabled={busy} onClick={() => perform(() => authAction('link', { provider }))}>{provider === 'google' ? <FaGoogle /> : <FaApple />}{provider}</button>)}</div>}
      <section className="account-settings-section"><h2>{t.changePassword}</h2><p><a href="/signin">{t.relogin}</a></p><form className="account-form" onSubmit={(event) => { const input = fields(event); perform(() => authAction('password', input)) }}><label>{t.newPassword}<input name="password" type="password" required minLength="12" maxLength="128" autoComplete="new-password" /></label><button className="account-secondary" disabled={busy}>{t.changePassword}</button></form></section>
      <section className="account-settings-section"><h2>{t.changeEmail}</h2><form className="account-form" onSubmit={(event) => { const input = fields(event); perform(() => authAction('email', input)) }}>{emailInput}<button className="account-secondary" disabled={busy}>{t.changeEmail}</button></form></section>
      {account.deletion && <section className="account-settings-section"><h2>{t.deleteAccount}</h2><p>{t.deleteWarning}</p><form className="account-form" onSubmit={(event) => { const input = fields(event); perform(async () => { await request('auth', 'delete', input); window.location.assign('/') }) }}><label>{t.confirmDelete}<input name="confirmation" required pattern="DELETE" autoComplete="off" /></label><button className="account-danger" disabled={busy}>{t.deleteAccount}</button></form></section>}
    </>
    else if (section === 'assistant') panel = <><h1>{t.assistant}</h1><AssistantPanel language={language} />
      <h2>{t.history}</h2><button className="account-secondary" disabled={busy} onClick={() => perform(async () => { setData(await request('account', 'chats')) })}>{t.history}</button>
      <button className="account-secondary" disabled={busy} onClick={() => perform(async () => { await request('account', 'clear-chats', {}); setData({ rows: [] }); setFeedback(t.done) })}>{t.clearHistory}</button>
      {data?.rows?.map((row) => <div className="assistant-exchange" key={row.id}><p>{row.question}</p><p>{row.answer}</p></div>)}
    </>
    else if (section === 'support') panel = <><h1>{t.support}</h1><form className="account-form" onSubmit={(event) => { const input = fields(event); perform(async () => { await request('account', 'support', { ...input, attachment_consent: input.attachment_consent === 'on' }); setFeedback(t.supportReceived); setRevision((n) => n + 1) }) }}>
      <label>{t.subject}<input name="subject" required minLength="3" maxLength="100" /></label><label>{t.message}<textarea name="message" required minLength="10" maxLength="4000" rows="5" /></label>
      <details><summary>{t.attach}</summary><label>{t.message}<textarea name="conversation" maxLength="8000" rows="3" /></label><label className="account-check"><input type="checkbox" name="attachment_consent" />{t.attach}</label></details>
      <button className="btn btn-primary" disabled={busy}>{t.send}</button></form>
      <ul className="account-list">{data?.rows?.map((row) => <li className="account-row" key={row.id}><span>{row.subject}</span><time>{new Date(row.created_at).toLocaleDateString(language)}</time><button className="account-icon" title={t.remove} aria-label={t.remove} onClick={() => remove('support', row.id)} disabled={busy}><PiTrashBold /></button></li>)}</ul>
    </>
    else panel = <><h1>{t[section]}</h1>{section === 'downloads' && <button className="btn btn-primary" disabled={busy} onClick={() => perform(async () => { const result = await request('account', 'download', { resource_id: 'mobilador' }); window.location.assign(result.url); setRevision((n) => n + 1) })}><PiDownloadSimpleBold />{t.download}</button>}
      {data === null && !error ? <p role="status">{t.loading}</p> : !data?.rows?.length ? <p className="account-empty">{t.empty} <a href="/#herramientas">{t.explore}</a></p> : <ul className="account-list">{data.rows.map((row) => <li className="account-row" key={row.id}><div>
        {section === 'favorites' ? <a href={resourceLinks[row.resource_id]}>{resourceLabels[row.resource_id]}</a> : <strong>{section === 'activity' ? t.events[row.kind] || t.activity : row.title || resourceLabels[row.resource_id]}</strong>}
        <time>{new Date(row.created_at).toLocaleDateString(language)}</time>
        {section === 'downloads' && <p>{row.version} · {t.requested}</p>}
        {section === 'saved' && row.payload?.values && <dl className="saved-values">{Object.entries(row.payload.values).filter(([, value]) => Number.isFinite(value)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
      </div><button className="account-icon" title={t.remove} aria-label={t.remove} disabled={busy} onClick={() => remove(section, row.id)}><PiTrashBold /></button></li>)}</ul>}
    </>
    content = <div className="account-layout"><aside><nav aria-label={t.account}>{sections.filter(([name]) => name !== 'assistant' || account.assistant).map(([name, Icon]) => <a key={name} href={name === 'overview' ? '/account' : `/account/${name}`} aria-current={section === name ? 'page' : undefined}><Icon aria-hidden="true" />{t[name]}</a>)}</nav><button disabled={busy} onClick={() => perform(signout)}><PiSignOutBold />{t.signout}</button></aside><div className="account-panel">{feedbackNode}{panel}{data?.next && <button className="account-secondary" disabled={busy} onClick={() => perform(async () => { const next = await request('account', section === 'assistant' ? 'chats' : section, undefined, undefined, data.next); setData((current) => ({ ...next, rows: [...current.rows, ...next.rows] })) })}>{t.more}</button>}</div></div>
  }
  return <><SiteNav scanner language={language === 'it' ? 'en' : language} skipTarget="main-content" /><main id="main-content" className="account-main" data-companion-obstacle>
    <div className="account-topline"><a href="/">DaniVex</a><label>{t.language}<select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="es">Español</option><option value="en">English</option><option value="it">Italiano</option><option value="pt">Português</option></select></label></div>{content}<footer className="account-footer"><a href="/privacy">{t.privacy}</a></footer>
  </main></>
}

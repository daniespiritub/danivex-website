import { useEffect, useState, useCallback } from 'react'
import { useAccount } from './context.js'
import { request } from './api.js'
import './admin.css'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'platform', label: 'Platform' },
  { id: 'audit', label: 'Audit Log' },
]

function sectionFromPath() {
  const m = /^\/admin\/(users|platform|audit)/.exec(window.location.pathname)
  return m ? m[1] : 'overview'
}

const METRICS = [
  ['users_total', 'Usuarios totales'],
  ['users_new_7d', 'Nuevos (7d)'],
  ['users_active_7d', 'Activos (7d)'],
  ['google_accounts', 'Cuentas Google'],
  ['email_accounts', 'Cuentas email'],
  ['downloads', 'Descargas'],
  ['favorites', 'Favoritos'],
  ['saved', 'Guardados'],
  ['admins', 'Admins'],
  ['super_admins', 'Super admins'],
]

const HEALTH_LABELS = {
  website: 'Website', supabase: 'Supabase', database: 'Database', accounts: 'Accounts',
  google_oauth: 'Google OAuth', apple_oauth: 'Apple OAuth', email: 'Email', assistant: 'Assistant',
  account_deletion: 'Account deletion', openai: 'OpenAI',
}
const STATUS_TONE = { active: 'ok', healthy: 'ok', configured: 'ok', disabled: 'off', not_configured: 'off', degraded: 'warn' }
const STATUS_TEXT = { active: 'Active', healthy: 'Healthy', configured: 'Configured', disabled: 'Disabled', not_configured: 'Not configured', degraded: 'Degraded' }

function relTime(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const AUDIT_COPY = {
  'admin.role.promoted': 'Rol promovido', 'admin.role.demoted': 'Rol degradado',
  'admin.feature.enabled': 'Flag activado', 'admin.feature.disabled': 'Flag desactivado',
}

function Skeleton({ rows = 3 }) {
  return <div className="adm-skeleton" aria-hidden="true">{Array.from({ length: rows }).map((_, i) => <div key={i} className="adm-skel-line" />)}</div>
}

function Overview() {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let alive = true
    Promise.all([request('admin', 'metrics'), request('admin', 'health')])
      .then(([m, h]) => { if (alive) setState({ loading: false, metrics: m.metrics, health: h.health }) })
      .catch((e) => { if (alive) setState({ loading: false, error: e.message }) })
    return () => { alive = false }
  }, [])
  if (state.loading) return <Skeleton rows={4} />
  if (state.error) return <ErrorState message="No pudimos cargar las métricas." />
  const activeCount = Object.values(state.health).filter((s) => ['active', 'healthy', 'configured'].includes(s)).length
  return (
    <>
      <div className="adm-metric-grid">
        {METRICS.map(([key, label], i) => (
          <div className={`adm-metric ${i === 0 ? 'adm-metric-lead' : ''}`} key={key}>
            <span className="adm-metric-value">{state.metrics[key] ?? '—'}</span>
            <span className="adm-metric-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="adm-panel">
        <div className="adm-panel-head"><h2>Estado de la plataforma</h2><span className="adm-pill adm-pill-ok">{activeCount} activos</span></div>
        <div className="adm-health-grid">
          {Object.entries(state.health).map(([key, status]) => (
            <div className="adm-health" key={key}>
              <span className={`adm-dot adm-dot-${STATUS_TONE[status] || 'off'}`} />
              <span className="adm-health-label">{HEALTH_LABELS[key] || key}</span>
              <span className={`adm-health-status adm-status-${STATUS_TONE[status] || 'off'}`}>{STATUS_TEXT[status] || status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Users({ isSuperAdmin }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState({ loading: true, rows: [] })
  const [busy, setBusy] = useState(null)
  const load = useCallback((term) => {
    setState((s) => ({ ...s, loading: true }))
    const params = new URLSearchParams({ action: 'users' })
    if (term) params.set('search', term)
    fetch(`/api/admin?${params}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((r) => { if (!r.ok) throw new Error(r.error); setState({ loading: false, rows: r.rows }) })
      .catch((e) => setState({ loading: false, rows: [], error: e.message }))
  }, [])
  useEffect(() => { load('') }, [load])
  const changeRole = async (user, role) => {
    if (!confirm(`¿Cambiar el rol de ${user.email || user.handle} a "${role}"?`)) return
    setBusy(user.user_id)
    try {
      await request('admin', 'set-role', { target: user.user_id, role })
      load(search)
    } catch (e) {
      alert(e.message === 'last_super_admin' ? 'No puedes degradar al último super admin.' : 'No se pudo cambiar el rol.')
    } finally { setBusy(null) }
  }
  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h2>Usuarios</h2>
        <form className="adm-search" onSubmit={(e) => { e.preventDefault(); load(search) }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email o handle" aria-label="Buscar usuarios" />
        </form>
      </div>
      {state.loading ? <Skeleton rows={5} /> : state.error ? <ErrorState message="No pudimos cargar los usuarios." onRetry={() => load(search)} />
        : state.rows.length === 0 ? <EmptyState title="Sin resultados" hint="Ajusta la búsqueda para encontrar usuarios." />
        : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Usuario</th><th>Provider</th><th>Rol</th><th>Registro</th><th>Última actividad</th>{isSuperAdmin && <th />}</tr></thead>
              <tbody>
                {state.rows.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="adm-user">
                        <span className="adm-avatar" aria-hidden="true">{(u.handle || u.email || '?').slice(0, 1).toUpperCase()}</span>
                        <div className="adm-user-id"><span className="adm-handle">{u.handle ? `@${u.handle}` : 'sin handle'}</span><span className="adm-email">{u.email}</span></div>
                      </div>
                    </td>
                    <td><span className="adm-provider">{u.providers || '—'}</span></td>
                    <td><span className={`adm-role adm-role-${u.role}`}>{u.role}</span></td>
                    <td className="adm-cell-muted">{relTime(u.created_at)}</td>
                    <td className="adm-cell-muted">{relTime(u.last_activity)}</td>
                    {isSuperAdmin && (
                      <td className="adm-actions">
                        <select value={u.role} disabled={busy === u.user_id} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Rol de ${u.email}`}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

function Platform() {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let alive = true
    request('admin', 'health').then((r) => { if (alive) setState({ loading: false, ...r }) }).catch((e) => { if (alive) setState({ loading: false, error: e.message }) })
    return () => { alive = false }
  }, [])
  if (state.loading) return <Skeleton rows={4} />
  if (state.error) return <ErrorState message="No pudimos cargar el estado de la plataforma." />
  return (
    <>
      <div className="adm-panel">
        <div className="adm-panel-head"><h2>Servicios</h2></div>
        <div className="adm-health-grid">
          {Object.entries(state.health).map(([key, status]) => (
            <div className="adm-health" key={key}>
              <span className={`adm-dot adm-dot-${STATUS_TONE[status] || 'off'}`} />
              <span className="adm-health-label">{HEALTH_LABELS[key] || key}</span>
              <span className={`adm-health-status adm-status-${STATUS_TONE[status] || 'off'}`}>{STATUS_TEXT[status] || status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="adm-panel">
        <div className="adm-panel-head"><h2>Feature flags</h2><span className="adm-hint">Solo lectura — se gestionan en el backend</span></div>
        <div className="adm-flags">
          {Object.entries(state.flags).map(([key, on]) => (
            <div className="adm-flag" key={key}>
              <span className="adm-flag-name">{key}</span>
              <span className={`adm-pill ${on ? 'adm-pill-ok' : 'adm-pill-off'}`}>{on ? 'Enabled' : 'Disabled'}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Audit() {
  const [state, setState] = useState({ loading: true, rows: [] })
  useEffect(() => {
    let alive = true
    request('admin', 'audit').then((r) => { if (alive) setState({ loading: false, rows: r.rows }) }).catch((e) => { if (alive) setState({ loading: false, rows: [], error: e.message }) })
    return () => { alive = false }
  }, [])
  if (state.loading) return <Skeleton rows={4} />
  if (state.error) return <ErrorState message="No pudimos cargar la auditoría." />
  if (state.rows.length === 0) return <EmptyState title="Sin actividad administrativa" hint="Las acciones sensibles (cambios de rol, flags) aparecerán aquí." />
  return (
    <div className="adm-panel">
      <div className="adm-panel-head"><h2>Audit log</h2></div>
      <ul className="adm-timeline">
        {state.rows.map((r) => (
          <li className="adm-event" key={r.id}>
            <span className="adm-event-dot" />
            <div className="adm-event-body">
              <span className="adm-event-action">{AUDIT_COPY[r.action] || r.action}</span>
              <span className="adm-event-meta">{r.actor_email || 'sistema'} → {r.target_email || '—'} · {r.metadata?.from} → {r.metadata?.to}</span>
            </div>
            <time className="adm-event-time">{relTime(r.created_at)}</time>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState({ title, hint }) {
  return <div className="adm-empty"><span className="adm-empty-title">{title}</span><span className="adm-empty-hint">{hint}</span></div>
}
function ErrorState({ message, onRetry }) {
  return <div className="adm-errorbox"><span>{message}</span>{onRetry && <button className="adm-btn-ghost" onClick={onRetry}>Reintentar</button>}</div>
}

export default function AdminPage() {
  const { ready, account, user } = useAccount()
  const [gate, setGate] = useState({ loading: true })
  const [section, setSection] = useState(sectionFromPath())

  useEffect(() => {
    if (!ready) return
    if (!account || !user) { setGate({ loading: false, forbidden: true, signin: true }); return }
    let alive = true
    request('admin', 'config')
      .then((r) => { if (alive) setGate({ loading: false, role: r.role, isAdmin: r.isAdmin, isSuperAdmin: r.isSuperAdmin }) })
      .catch(() => { if (alive) setGate({ loading: false, forbidden: true }) })
    return () => { alive = false }
  }, [ready, account, user])

  const go = (id) => { setSection(id); window.history.pushState(null, '', id === 'overview' ? '/admin' : `/admin/${id}`) }

  if (!ready || gate.loading) return <div className="adm-shell"><div className="adm-boot">DaniVex Admin…</div></div>
  if (gate.signin) {
    return <div className="adm-shell"><div className="adm-403"><span className="adm-403-code">401</span><h1>Inicia sesión</h1><p>Necesitas una sesión activa para acceder al panel de administración.</p><a className="adm-btn-primary" href="/signin">Iniciar sesión</a></div></div>
  }
  if (gate.forbidden || !gate.isAdmin) {
    return <div className="adm-shell"><div className="adm-403"><span className="adm-403-code">403</span><h1>Sin acceso</h1><p>No tienes permisos para ver esta sección.</p><a className="adm-btn-ghost" href="/account">Volver a mi cuenta</a></div></div>
  }

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <a className="adm-brand" href="/"><span className="adm-brand-mark">DV</span><span>DaniVex<b>Admin</b></span></a>
        <nav className="adm-nav">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`adm-nav-item ${section === s.id ? 'is-active' : ''}`} onClick={() => go(s.id)}>{s.label}</button>
          ))}
        </nav>
        <div className="adm-side-foot">
          <span className={`adm-role adm-role-${gate.role}`}>{gate.role}</span>
          <a className="adm-side-link" href="/account">Mi cuenta</a>
        </div>
      </aside>
      <main className="adm-main">
        <header className="adm-topbar">
          <div><span className="adm-crumb">Admin</span><h1>{SECTIONS.find((s) => s.id === section)?.label}</h1></div>
          <a className="adm-topbar-user" href="/account">{user?.handle ? `@${user.handle}` : user?.email}</a>
        </header>
        <div className="adm-content">
          {section === 'overview' && <Overview />}
          {section === 'users' && <Users isSuperAdmin={gate.isSuperAdmin} />}
          {section === 'platform' && <Platform />}
          {section === 'audit' && <Audit />}
        </div>
      </main>
    </div>
  )
}

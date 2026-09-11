import { useEffect, useRef, useState } from 'react'
import { PiArrowClockwiseBold, PiCrownBold, PiShareNetworkBold } from 'react-icons/pi'
import AIAnalysisCard from '../components/prime-scanner/AIAnalysisCard'
import LoadingScanner from '../components/prime-scanner/LoadingScanner'
import PlayerProfileCard from '../components/prime-scanner/PlayerProfileCard'
import PrimeBadge from '../components/prime-scanner/PrimeBadge'
import PrimeProgress from '../components/prime-scanner/PrimeProgress'
import ShareCard from '../components/prime-scanner/ShareCard'
import logo from '../assets/logo.webp'
import fondo from '../assets/fondo-gamer.webp'
import { formatNumber, generatePlayerFromLookup, scannerSteps } from '../data/primeScanner'
import { buildDaniVexAiRead } from '../data/aiSummary'
import { comparePlayers, compareSummary } from '../data/compare'
import '../styles/prime-scanner.css'

// Regiones soportadas por las fuentes de datos. "Autodetectar" deja que la
// fuente keyless determine la region; el codigo explicito lo usan proveedores
// ricos (ej: SiamBhau) que lo requieren.
const REGIONS = [
  { value: '', label: 'Autodetectar region' },
  { value: 'US', label: 'America (US / NA)' },
  { value: 'SAC', label: 'Sudamerica (SAC)' },
  { value: 'BR', label: 'Brasil (BR)' },
  { value: 'IND', label: 'India (IND)' },
  { value: 'SG', label: 'Singapur (SG)' },
  { value: 'ID', label: 'Indonesia (ID)' },
  { value: 'TH', label: 'Tailandia (TH)' },
  { value: 'VN', label: 'Vietnam (VN)' },
  { value: 'TW', label: 'Taiwan (TW)' },
  { value: 'ME', label: 'Medio Oriente (ME)' },
  { value: 'PK', label: 'Pakistan (PK)' },
  { value: 'EU', label: 'Europa (EU)' },
]

const previewItems = [
  { title: 'Perfil publico', text: 'Nickname, UID, region, nivel, experiencia y me gusta tal como figuran en la fuente.' },
  { title: 'Cuenta', text: 'Fecha de creacion, antiguedad y ultimo acceso cuando la fuente los publica.' },
  { title: 'Gremio', text: 'Nombre del clan, ID, nivel, miembros y lider, si el jugador tiene uno.' },
  { title: 'Rangos', text: 'Clasificatoria BR y Duelo de Escuadras con puntos, si la fuente los ofrece.' },
  { title: 'Outfit', text: 'Personaje y cosmeticos equipados, cuando el proveedor los devuelve.' },
  { title: 'Historial DaniVex', text: 'Cambios detectados entre consultas: nick, nivel, rango, clan, outfit y mas.' },
]

function PlayerScanner() {
  const [uid, setUid] = useState('')
  const [region, setRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPrimeLoading, setIsPrimeLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [player, setPlayer] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showShareCard, setShowShareCard] = useState(false)
  const [cacheInfo, setCacheInfo] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [compareUid, setCompareUid] = useState('')
  const [comparePlayer, setComparePlayer] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  const resultRef = useRef(null)

  async function handleSubmit(event) {
    event.preventDefault()
    await scanUidValue(uid)
  }

  async function scanUidValue(value) {
    const cleanUid = String(value || '').replace(/[^\d]/g, '').slice(0, 12)
    if (cleanUid.length < 6) {
      setErrorMessage('El UID debe tener entre 6 y 12 digitos.')
      return
    }

    setUid(cleanUid)
    setIsLoading(true)
    setPlayer(null)
    setActionMessage('')
    setErrorMessage('')
    setShowShareCard(false)
    setCacheInfo(null)
    setTimeline([])
    setCompareUid('')
    setComparePlayer(null)
    setProgress(0)

    for (let index = 0; index < scannerSteps.length; index += 1) {
      setActiveStep(index)
      setProgress(Math.round(((index + 0.35) / scannerSteps.length) * 100))
      await wait(210 + index * 28)
    }

    const lookup = await lookupPlayer(cleanUid, region)
    const nextPlayer = generatePlayerFromLookup(cleanUid, lookup)

    setProgress(100)
    await wait(150)
    setPlayer(nextPlayer)
    setCacheInfo(lookup?.cache || null)
    setIsLoading(false)

    if (nextPlayer.lookupStatus !== 'real') {
      setErrorMessage(cleanErrorMessage(lookup))
    } else {
      fetchTimeline(cleanUid).then(setTimeline)
    }

    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  // Confirmacion de Prime opcional (fuente aparte: FreeFireJornal Prime).
  async function confirmPrime() {
    if (!player) return
    setIsPrimeLoading(true)
    setActionMessage('Consultando nivel Prime en FreeFireJornal...')
    const primeLookup = await lookupFreeFirePrime(player.uid)
    setIsPrimeLoading(false)

    if (!primeLookup.ok || !primeLookup.primeConfirmed) {
      setActionMessage(primeLookup.message || 'No se pudo confirmar Prime para este UID.')
      return
    }
    setActionMessage(`Prime confirmado: ${primeLookup.primeLevel}, ${formatNumber(primeLookup.diamonds)} diamantes.`)
    setPlayer((current) => (current && current.uid === player.uid ? applyPrimeToPlayer(current, primeLookup) : current))
  }

  // Deep-link /cuenta/:uid.html
  useEffect(() => {
    const match = window.location.pathname.match(/^\/cuenta\/(\d+)\.html$/)
    if (match) scanUidValue(match[1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetScanner() {
    setUid('')
    setPlayer(null)
    setActionMessage('')
    setErrorMessage('')
    setShowShareCard(false)
    setCompareUid('')
    setComparePlayer(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function runCompare(event) {
    event?.preventDefault?.()
    const cleanCompare = String(compareUid).replace(/[^\d]/g, '').slice(0, 12)
    if (cleanCompare.length < 6 || !player) return
    setIsComparing(true)
    setComparePlayer(null)
    const lookup = await lookupPlayer(cleanCompare, region)
    setComparePlayer(generatePlayerFromLookup(cleanCompare, lookup))
    setIsComparing(false)
  }

  function showShare() {
    setShowShareCard(true)
    setActionMessage('Tarjeta lista para captura con los datos publicos detectados.')
    window.setTimeout(() => document.querySelector('.share-card-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }

  const outfit = Array.isArray(player?.outfit) ? player.outfit : []
  const primeLevelText = player?.providerPrimeLevel
    ? `Prime ${player.providerPrimeLevel}`
    : (player?.prime?.diamonds > 0 ? `Prime ${player.prime.level}` : 'No disponible')

  return (
    <main className="scanner-page" style={{ backgroundImage: `url(${fondo})` }}>
      <header className="scanner-nav">
        <a className="scanner-brand" href="/">
          <img src={logo} alt="DaniVex" />
          <span>DANIVEX</span>
        </a>
        <a className="scanner-home-link" href="/">Volver al inicio</a>
      </header>

      <section className="scanner-hero">
        <div className="scanner-hero-copy">
          <span className="scanner-kicker">Buscador de jugadores Free Fire</span>
          <h1>Player Scanner</h1>
          <p>
            Busca cualquier jugador de Free Fire por su UID y consulta toda su informacion publica:
            perfil, region, nivel, rangos, clan, outfit e historial de cambios de DaniVex.
          </p>
        </div>

        <div className="scanner-stack">
          <form className="uid-form" onSubmit={handleSubmit}>
            <label htmlFor="player-uid-input">UID del jugador</label>
            <div className="uid-input-wrap">
              <input
                id="player-uid-input"
                inputMode="numeric"
                maxLength={12}
                placeholder="Ej: 2196518104"
                value={uid}
                onChange={(event) => setUid(event.target.value.replace(/[^\d]/g, '').slice(0, 12))}
              />
              <button type="submit" disabled={isLoading || uid.length < 6}>
                {isLoading ? 'Buscando...' : 'Buscar jugador'}
              </button>
            </div>

            <label htmlFor="player-region-select" style={{ marginTop: 12 }}>Region (opcional)</label>
            <select
              id="player-region-select"
              className="scanner-region-select"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r.value || 'auto'} value={r.value}>{r.label}</option>
              ))}
            </select>

            <p className="uid-helper">
              El UID aparece en tu perfil de Free Fire, debajo del nick (6 a 12 digitos). La region se
              autodetecta; solo hace falta elegirla con fuentes que la requieran.
            </p>
          </form>
        </div>
      </section>

      <section className="scanner-preview">
        <h2>Que vas a ver</h2>
        <div className="scanner-preview-grid">
          {previewItems.map((item) => (
            <div className="scanner-preview-item" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <p className="scanner-preview-source">
          El perfil se obtiene de fuentes publicas de Free Fire mediante la capa de proveedores de
          DaniVex. Los datos ricos (rangos, prime, outfit) aparecen cuando la fuente activa los ofrece;
          si no, se muestran como no disponibles. DaniVex nunca inventa informacion.
        </p>
      </section>

      {isLoading && <LoadingScanner activeStep={activeStep} progress={progress} />}

      {errorMessage && !player?.lookupStatus && (
        <p className="action-message warning" style={{ maxWidth: 720, margin: '18px auto' }}>{errorMessage}</p>
      )}

      {player && player.lookupStatus === 'real' && (
        <section className="scanner-results" ref={resultRef}>
          <PlayerProfileCard player={player} />

          {cacheInfo?.state === 'stale' && (
            <p className="action-message warning">
              Ultima informacion disponible: los proveedores no respondieron y DaniVex esta mostrando el
              ultimo perfil guardado{cacheInfo.lastObservedAt ? ` (observado el ${formatDate(cacheInfo.lastObservedAt)})` : ''}.
            </p>
          )}

          {player.prime?.diamonds > 0 && (
            <div className="scanner-grid two">
              <PrimeBadge prime={player.prime} />
              <PrimeProgress prime={player.prime} />
            </div>
          )}

          <MetricGroup title="Cabecera">
            <Metric label="Nickname" value={player.username} />
            <Metric label="UID" value={player.uid} />
            <Metric label="Region" value={player.region || 'No disponible'} />
            <Metric label="Nivel" value={player.level || 'No disponible'} />
            <Metric label="Prime Level" value={primeLevelText} />
            <Metric label="Me gusta" value={formatNumber(player.likes || 0)} />
          </MetricGroup>

          <MetricGroup title="Cuenta">
            <Metric label="Experiencia" value={player.exp || 'No disponible'} />
            <Metric label="Cuenta creada" value={formatDate(player.creationDate)} />
            <Metric label="Antiguedad exacta" value={player.accountAge || 'No disponible'} />
            <Metric label="Ultimo login" value={formatDate(player.lastLogin)} />
            <Metric label="Version del juego" value={player.gameVersion || 'No disponible'} />
            <Metric label="Pase Booyah" value={player.pass || 'No disponible'} />
            {player.title && <Metric label="Titulo" value={player.title} />}
            {player.badgeCount && <Metric label="Insignias" value={player.badgeCount} />}
          </MetricGroup>

          {(player.rankBR || player.rankCS) && (
            <MetricGroup title="Rangos">
              <Metric label="Clasificatoria BR" value={player.rankBR || 'No disponible'} />
              <Metric label="Puntos BR" value={player.rankBRPoints || 'No disponible'} />
              <Metric label="Duelo de Escuadras" value={player.rankCS || 'No disponible'} />
              <Metric label="Puntos CS" value={player.rankCSPoints || 'No disponible'} />
              {player.season && <Metric label="Temporada" value={player.season} />}
            </MetricGroup>
          )}

          {(player.clan || player.clanId) && (
            <MetricGroup title="Clan">
              <Metric label="Nombre" value={player.clan || 'No disponible'} />
              <Metric label="Clan ID" value={player.clanId || 'No disponible'} />
              <Metric label="Nivel" value={player.clanLevel || 'No disponible'} />
              <Metric label="Miembros" value={player.clanMembers || 'No disponible'} />
              {player.clanLeader && <Metric label="Lider" value={player.clanLeader} />}
            </MetricGroup>
          )}

          {(player.pet || outfit.length > 0) && (
            <div className="metrics-group">
              <h4>Outfit y cosmeticos</h4>
              {player.pet && (
                <div className="metrics-grid">
                  <Metric label="Mascota (ID)" value={player.pet} />
                  <Metric label="Nivel mascota" value={player.petLevel || 'No disponible'} />
                </div>
              )}
              {outfit.length > 0 && (
                <div className="outfit-grid">
                  {outfit.map((item, index) => (
                    <div className="outfit-item" key={`${item.id || index}`}>
                      {item.image
                        ? <img src={item.image} alt={`Item ${item.id}`} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        : <span className="outfit-id">#{item.id}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {timeline.length > 0 && (
            <MetricGroup title="Historial reciente (cambios detectados por DaniVex)">
              {timeline.slice(0, 8).map((event, index) => {
                const short = (s) => (String(s || '').length <= 24 ? String(s || '') : '')
                const detail = short(event.from) !== '' || short(event.to) !== ''
                  ? `${short(event.from) || '—'} -> ${short(event.to) || '—'}`
                  : 'actualizado'
                return (
                  <Metric key={`${event.at || index}-${event.type}`} label={EVENT_LABELS[event.type] || event.type} value={detail} />
                )
              })}
            </MetricGroup>
          )}

          <div className="action-message">
            <strong>Lectura DaniVex AI:</strong> {buildDaniVexAiRead(player, timeline)}
          </div>

          {player.bio && (
            <div className="action-message"><strong>Biografia:</strong> {player.bio}</div>
          )}

          <p className="source-note">
            Fuente del perfil: {player.lookupProvider}. {player.cacheHit ? 'Servido desde la cache privada de DaniVex.' : 'Consulta nueva.'}
          </p>

          <div className="scanner-actions" aria-label="Acciones del resultado">
            <button type="button" onClick={resetScanner}><PiArrowClockwiseBold aria-hidden="true" /> Buscar otro jugador</button>
            <button type="button" onClick={confirmPrime} disabled={isPrimeLoading}><PiCrownBold aria-hidden="true" /> {isPrimeLoading ? 'Consultando...' : 'Confirmar Prime'}</button>
            <button type="button" onClick={showShare}><PiShareNetworkBold aria-hidden="true" /> Compartir</button>
          </div>

          <div className="compare-panel">
            <h4>Comparar con otro jugador</h4>
            <form className="uid-form" onSubmit={runCompare}>
              <div className="uid-input-wrap">
                <input
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="UID a comparar"
                  value={compareUid}
                  onChange={(event) => setCompareUid(event.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                />
                <button type="submit" disabled={isComparing || compareUid.length < 6}>
                  {isComparing ? 'Comparando...' : 'Comparar'}
                </button>
              </div>
            </form>

            {comparePlayer && comparePlayer.lookupStatus === 'real' && (
              <div className="compare-table">
                <div className="compare-row compare-head">
                  <span>Metrica</span>
                  <strong>{player.username}</strong>
                  <strong>{comparePlayer.username}</strong>
                </div>
                {comparePlayers(player, comparePlayer).map((row) => (
                  <div className="compare-row" key={row.label}>
                    <span>{row.label}</span>
                    <b className={row.leader === 'a' ? 'compare-lead' : ''}>{row.a || 'No disponible'}</b>
                    <b className={row.leader === 'b' ? 'compare-lead' : ''}>{row.b || 'No disponible'}</b>
                  </div>
                ))}
                <p className="compare-summary">
                  {compareSummary(comparePlayers(player, comparePlayer)) === 'tie'
                    ? 'Empate en metricas numericas.'
                    : `Lidera en mas metricas: ${compareSummary(comparePlayers(player, comparePlayer)) === 'a' ? player.username : comparePlayer.username}.`}
                </p>
              </div>
            )}

            {comparePlayer && comparePlayer.lookupStatus !== 'real' && (
              <p className="action-message warning">No se encontro perfil publico para ese UID.</p>
            )}
          </div>

          {player.aiAnalysis && <AIAnalysisCard analysis={player.aiAnalysis} />}
          {actionMessage && <p className="action-message">{actionMessage}</p>}
          {showShareCard && <ShareCard player={player} events={timeline} />}
        </section>
      )}
    </main>
  )
}

const EVENT_LABELS = {
  NICKNAME_CHANGED: 'Cambio de nick',
  LEVEL_UP: 'Subio de nivel',
  LEVEL_CHANGED: 'Cambio de nivel',
  LIKES_CHANGED: 'Cambiaron los me gusta',
  GUILD_CHANGED: 'Cambio de gremio',
  AVATAR_CHANGED: 'Cambio de avatar',
  BANNER_CHANGED: 'Cambio de banner',
  BIO_CHANGED: 'Cambio de biografia',
  PRIME_CHANGED: 'Cambio de nivel Prime',
  REGION_CHANGED: 'Cambio de region',
  RANK_BR_CHANGED: 'Cambio de rango BR',
  RANK_CS_CHANGED: 'Cambio de rango CS',
  TITLE_CHANGED: 'Cambio de titulo',
  PET_CHANGED: 'Cambio de mascota',
  OUTFIT_CHANGED: 'Cambio de outfit',
}

function cleanErrorMessage(lookup) {
  if (!lookup) return 'No se pudo completar la busqueda. Intenta de nuevo.'
  if (lookup.error === 'uid_invalido') return 'El UID debe tener entre 6 y 12 digitos.'
  if (lookup.error === 'rate_limited') return 'Demasiadas consultas seguidas. Espera unos segundos e intenta de nuevo.'
  return lookup.message || 'No se encontro un perfil publico para este UID.'
}

async function fetchTimeline(uid) {
  try {
    const response = await fetch(`/api/free-fire-timeline?uid=${encodeURIComponent(uid)}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.ok ? data.events : []
  } catch {
    return []
  }
}

async function lookupPlayer(uid, region) {
  try {
    const params = new URLSearchParams({ uid })
    if (region) params.set('region', region)
    const response = await fetch(`/api/player?${params.toString()}`)
    if (!response.ok && response.status !== 200) {
      const body = await response.json().catch(() => ({}))
      return { ok: false, uid, ...body }
    }
    return await response.json()
  } catch (error) {
    return { ok: false, error: 'lookup_unavailable', uid, message: `No se pudo conectar con el servidor (${error.message}).` }
  }
}

async function lookupFreeFirePrime(uid) {
  try {
    const response = await fetch(`/api/free-fire-prime?uid=${encodeURIComponent(uid)}`)
    if (!response.ok) throw new Error(`prime_http_${response.status}`)
    return await response.json()
  } catch (error) {
    return { ok: false, error: 'prime_lookup_unavailable', uid, message: `No se pudo conectar FreeFireJornal Prime (${error.message}).` }
  }
}

function applyPrimeToPlayer(player, primeLookup) {
  const level = Number(primeLookup.primeLevelNumber || 0)
  const diamonds = Number(primeLookup.diamonds || 0)
  return {
    ...player,
    providerPrimeLevel: primeLookup.primeLevel || player.providerPrimeLevel,
    lookupProvider: player.lookupProvider?.includes('FreeFireJornal Prime')
      ? player.lookupProvider
      : `${player.lookupProvider || 'Perfil publico'} + FreeFireJornal Prime`,
    prime: {
      ...player.prime,
      level,
      points: diamonds,
      diamonds,
      missing: Number(primeLookup.missingForNextPrime || 0),
      percent: Number(primeLookup.primeProgressPercent || 0),
      isMax: level >= 8,
      source: primeLookup.sourceUrl || 'FreeFireJornal Prime',
    },
    aiAnalysis: `Prime confirmado desde FreeFireJornal: ${primeLookup.primeLevel}. Diamantes detectados: ${formatNumber(diamonds)}.`,
  }
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function MetricGroup({ title, children }) {
  return (
    <div className="metrics-group">
      <h4>{title}</h4>
      <div className="metrics-grid">{children}</div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function wait(ms) {
  return new Promise((resolve) => { window.setTimeout(resolve, ms) })
}

export default PlayerScanner

import { useEffect, useRef, useState } from 'react'
import { PiArrowClockwiseBold, PiLightningBold, PiScalesBold, PiShareNetworkBold, PiShieldBold } from 'react-icons/pi'
import AIAnalysisCard from '../components/prime-scanner/AIAnalysisCard'
import LoadingScanner from '../components/prime-scanner/LoadingScanner'
import PlayerProfileCard from '../components/prime-scanner/PlayerProfileCard'
import PrimeBadge from '../components/prime-scanner/PrimeBadge'
import PrimePrivileges from '../components/prime-scanner/PrimePrivileges'
import PrimeProgress from '../components/prime-scanner/PrimeProgress'
import ShareCard from '../components/prime-scanner/ShareCard'
import UIDSearchForm from '../components/prime-scanner/UIDSearchForm'
import logo from '../assets/logo.png'
import fondo from '../assets/fondo-gamer.png'
import { formatNumber, generatePlayerFromLookup, scannerSteps } from '../data/primeScanner'
import '../styles/prime-scanner.css'

const seoTitle = 'Free Fire Prime AI Scanner - Analiza tu cuenta por UID'
const seoDescription = 'Consulta perfiles publicos de Free Fire por UID y verifica el nivel Prime por Player ID.'

function FreeFirePrimeScanner() {
  const [uid, setUid] = useState('')
  const [primeUid, setPrimeUid] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPrimeLoading, setIsPrimeLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [player, setPlayer] = useState(null)
  const [primeResult, setPrimeResult] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [showShareCard, setShowShareCard] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    document.title = seoTitle
    const meta = ensureMetaDescription()
    meta.setAttribute('content', seoDescription)
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    await scanUidValue(uid)
  }

  async function handlePrimeSubmit(event) {
    event.preventDefault()
    await scanPrimeValue(primeUid || uid)
  }

  async function scanUidValue(value) {
    const cleanUid = String(value || '').replace(/[^\d]/g, '').slice(0, 14)
    if (!cleanUid) return

    setUid(cleanUid)
    setPrimeUid(cleanUid)
    setIsLoading(true)
    setPlayer(null)
    setActionMessage('')
    setShowShareCard(false)
    setProgress(0)

    for (let index = 0; index < scannerSteps.length; index += 1) {
      setActiveStep(index)
      setProgress(Math.round(((index + 0.35) / scannerSteps.length) * 100))
      await wait(230 + index * 30)
    }

    const lookup = await lookupFreeFireUid(cleanUid)
    const nextPlayer = generatePlayerFromLookup(cleanUid, lookup)
    const cleanPlayer = hidePrimeUntilPrimeSearch(nextPlayer)

    setProgress(100)
    await wait(160)
    setPlayer(cleanPlayer)
    setIsLoading(false)

    setActionMessage('Perfil analizado. El Prime se consulta aparte, en el buscador de UID / Player ID Prime.')
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  async function scanPrimeValue(value) {
    const cleanUid = String(value || '').replace(/[^\d]/g, '').slice(0, 14)
    if (!cleanUid) return

    setPrimeUid(cleanUid)
    setIsPrimeLoading(true)
    setPrimeResult(null)
    setActionMessage('Consultando nivel Prime en FreeFireJornal...')

    const primeLookup = await lookupFreeFirePrime(cleanUid)

    setPrimeResult(primeLookup)
    setIsPrimeLoading(false)

    if (!primeLookup.ok || !primeLookup.primeConfirmed) {
      setActionMessage(primeLookup.message || 'No se pudo confirmar Prime para este UID / Player ID.')
      return
    }

    setActionMessage(
      `Prime confirmado: ${primeLookup.primeLevel}, ${formatNumber(primeLookup.diamonds)} diamantes, ${primeLookup.nextPrimeLevel === 'MAX' ? 'nivel maximo' : `${formatNumber(primeLookup.missingForNextPrime)} para ${primeLookup.nextPrimeLevel}`}`,
    )

    setPlayer((currentPlayer) => {
      if (!currentPlayer || currentPlayer.uid !== cleanUid) return currentPlayer
      return applyPrimeToPlayer(currentPlayer, primeLookup)
    })
  }

  useEffect(() => {
    const match = window.location.pathname.match(/^\/cuenta\/(\d+)\.html$/)
    if (!match) return
    scanUidValue(match[1])
  }, [])

  function resetScanner() {
    setUid('')
    setPrimeUid('')
    setPlayer(null)
    setPrimeResult(null)
    setActionMessage('')
    setShowShareCard(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function verifySanctions() {
    setActionMessage('Verificacion de sanciones no disponible: las fuentes publicas usadas no confirman sanciones de forma fiable.')
  }

  function compareOgAccount() {
    if (!player) return
    const read = player.ogLevel >= 7
      ? 'tiene lectura OG fuerte y rareza superior para una cuenta de Free Fire.'
      : 'todavia puede subir su lectura OG con mas antiguedad, coleccion y actividad.'
    setActionMessage(`Comparacion OG: ${player.username} ${read}`)
  }

  function showShare() {
    setShowShareCard(true)
    setActionMessage('Tarjeta lista para screenshot con los datos publicos detectados.')
    window.setTimeout(() => document.querySelector('.share-card-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }

  function roastPlayer() {
    if (!player) return
    const roast = player.prime.level >= 6
      ? 'AI Gamer Roast: esa cuenta tiene tantos Prime Points que el lobby se queda mirando antes de empezar la partida.'
      : 'AI Gamer Roast: la cuenta va bien, pero ese Prime todavia necesita mas brillo para presumir en sala.'
    setActionMessage(roast)
  }

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
          <span className="scanner-kicker">Perfil y Prime por separado</span>
          <h1>Free Fire Prime AI Scanner</h1>
          <p>
            Usa el primer buscador para el perfil publico. Usa el segundo buscador para consultar el nivel Prime por UID / Player ID.
          </p>
        </div>

        <div className="scanner-stack">
          <UIDSearchForm
            isLoading={isLoading}
            uid={uid}
            onSubmit={handleSubmit}
            onUidChange={setUid}
          />

          <PrimeSearchForm
            uid={primeUid}
            isLoading={isPrimeLoading}
            onUidChange={setPrimeUid}
            onSubmit={handlePrimeSubmit}
          />
        </div>
      </section>

      {isLoading && <LoadingScanner activeStep={activeStep} progress={progress} />}

      {primeResult && (
        <section className="scanner-results" style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Resultado Prime</h2>

          <div className="metrics-grid">
            <Metric label="UID / Player ID" value={primeResult.uid || primeUid} />
            <Metric label="Jugador" value={primeResult.nickname || 'No disponible'} />
            <Metric label="Nivel Prime" value={primeResult.primeConfirmed ? primeResult.primeLevel : 'No confirmado'} />
            <Metric label="Diamantes recargados" value={primeResult.diamondsConfirmed ? `${formatNumber(primeResult.diamonds)}+` : 'No confirmado'} />
            <Metric label="Siguiente Prime" value={primeResult.nextPrimeLevel || 'No confirmado'} />
            <Metric label="Falta para siguiente" value={primeResult.primeConfirmed ? formatNumber(primeResult.missingForNextPrime || 0) : 'No confirmado'} />
            <Metric label="Progreso Prime" value={primeResult.primeConfirmed ? `${primeResult.primeProgressPercent || 0}%` : 'No confirmado'} />
            <Metric label="Fuente" value="FreeFireJornal Prime" />
          </div>

          {primeResult.rawResult && (
            <div className="action-message">
              <strong>Resultado detectado:</strong> {primeResult.rawResult}
            </div>
          )}

          {!primeResult.primeConfirmed && (
            <div className="action-message warning">
              FreeFireJornal no devolvio Prime confirmado para este UID. Puedes probar de nuevo o verificar manualmente en su pagina.
            </div>
          )}
        </section>
      )}

      {player && (
        <section className="scanner-results" ref={resultRef}>
          <PlayerProfileCard player={player} />

          {player.prime.diamonds > 0 && (
            <div className="scanner-grid two">
              <PrimeBadge prime={player.prime} />
              <PrimeProgress prime={player.prime} />
            </div>
          )}

          <MetricGroup title="Cuenta">
            <Metric label="Nombre de cuenta" value={player.username} />
            <Metric label="UID" value={player.uid} />
            <Metric label="Region" value={`${player.region} (${player.regionConfidence}% ${player.regionSource})`} />
            <Metric label="Cuenta creada" value={formatDate(player.creationDate)} />
            <Metric label="Ultimo login" value={formatDate(player.lastLogin)} />
            <Metric label="Version del juego" value={player.gameVersion || 'No disponible'} />
          </MetricGroup>

          <MetricGroup title="Actividad y progreso">
            <Metric label="Nivel" value={player.level || 'No disponible'} />
            <Metric label="Experiencia" value={player.exp || 'No disponible'} />
            <Metric label="Me gusta" value={formatNumber(player.likes || 0)} />
            <Metric label="Pase Booyah" value={player.pass || 'No disponible'} />
            <Metric label="Prime" value={player.prime.diamonds > 0 ? `Prime ${player.prime.level}` : 'Consultar arriba en Prime'} />
          </MetricGroup>

          <MetricGroup title="Clan">
            <Metric label="Clan" value={player.clan || 'No disponible'} />
            <Metric label="Clan ID" value={player.clanId || 'No disponible'} />
            <Metric label="Nivel clan" value={player.clanLevel || 'No disponible'} />
            <Metric label="Miembros clan" value={player.clanMembers || 'No disponible'} />
            <Metric label="Skin" value={player.skinStatus || 'No disponible'} />
          </MetricGroup>

          {player.bio && (
            <div className="action-message">
              <strong>Biografia:</strong> {player.bio}
            </div>
          )}

          <p className="source-note">
            Fuente del perfil: {player.lookupProvider}. {player.cacheHit ? 'Datos guardados en cache privada de DaniVex.' : 'Consulta nueva, no estaba guardada.'}
          </p>

          {player.prime.diamonds > 0 && (
            <div className="scanner-grid two">
              <PrimePrivileges level={player.prime.level} />
              <AIAnalysisCard analysis={player.aiAnalysis} />
            </div>
          )}

          <div className="scanner-actions" aria-label="Acciones del resultado">
            <button type="button" onClick={resetScanner}><PiArrowClockwiseBold aria-hidden="true" /> Analizar otra cuenta</button>
            <button type="button" onClick={verifySanctions}><PiShieldBold aria-hidden="true" /> Verificar sanciones</button>
            <button type="button" onClick={compareOgAccount}><PiScalesBold aria-hidden="true" /> Comparar OG</button>
            <button type="button" onClick={showShare}><PiShareNetworkBold aria-hidden="true" /> Compartir</button>
            <button type="button" onClick={roastPlayer}><PiLightningBold aria-hidden="true" /> AI Roast</button>
          </div>

          {player.lookupStatus !== 'real' && (
            <p className="action-message warning">
              {player.lookupMessage || 'La consulta real no devolvio nickname/region. No se invento identidad de cuenta.'}
            </p>
          )}

          {actionMessage && <p className="action-message">{actionMessage}</p>}
          {showShareCard && <ShareCard player={player} />}
        </section>
      )}

      {!player && actionMessage && <p className="action-message">{actionMessage}</p>}
    </main>
  )
}

function PrimeSearchForm({ uid, isLoading, onUidChange, onSubmit }) {
  return (
    <form className="uid-form" onSubmit={onSubmit} style={{ marginTop: 16 }}>
      <label htmlFor="prime-uid-input">UID / Player ID para nivel Prime</label>
      <div className="uid-input-wrap">
        <input
          id="prime-uid-input"
          inputMode="numeric"
          maxLength={14}
          placeholder="Ejemplo: 279180537"
          value={uid}
          onChange={(event) => onUidChange(event.target.value.replace(/[^\d]/g, '').slice(0, 14))}
        />
        <button type="submit" disabled={isLoading || !uid}>
          {isLoading ? 'Verificando...' : 'Ver nivel Prime'}
        </button>
      </div>
      <p className="uid-helper">
        Usa la herramienta de FreeFireJornal para intentar confirmar Prime y diamantes comprados.
      </p>
    </form>
  )
}

async function lookupFreeFireUid(uid) {
  try {
    const response = await fetch(`/api/free-fire-uid?uid=${encodeURIComponent(uid)}`)
    if (!response.ok) throw new Error(`lookup_http_${response.status}`)
    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: 'lookup_unavailable',
      uid,
      provider: 'Perfil publico',
      message: `No se pudo conectar el validador real desde esta sesion (${error.message}).`,
    }
  }
}

async function lookupFreeFirePrime(uid) {
  try {
    const response = await fetch(`/api/free-fire-prime?uid=${encodeURIComponent(uid)}`)
    if (!response.ok) throw new Error(`prime_http_${response.status}`)
    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: 'prime_lookup_unavailable',
      uid,
      message: `No se pudo conectar FreeFireJornal Prime desde esta sesion (${error.message}).`,
    }
  }
}

function hidePrimeUntilPrimeSearch(player) {
  return {
    ...player,
    prime: {
      ...player.prime,
      level: 0,
      points: 0,
      diamonds: 0,
      missing: 100,
      percent: 0,
      isMax: false,
      source: '',
      next: {
        level: 1,
        diamonds: 100,
        points: 100,
      },
    },
  }
}

function applyPrimeToPlayer(player, primeLookup) {
  const level = Number(primeLookup.primeLevelNumber || 0)
  const diamonds = Number(primeLookup.diamonds || 0)

  return {
    ...player,
    username: primeLookup.nickname || player.username,
    lookupProvider: player.lookupProvider?.includes('FreeFireJornal Prime')
      ? player.lookupProvider
      : `${player.lookupProvider || 'Perfil publico'} + FreeFireJornal Prime`,
    prime: {
      ...player.prime,
      level,
      points: diamonds,
      diamonds,
      currentFloor: Number(primeLookup.currentPrimeRequirement || 0),
      next: primeLookup.nextPrimeLevel === 'MAX'
        ? null
        : {
            level: level + 1,
            diamonds: Number(primeLookup.nextRequired || 0),
            points: Number(primeLookup.nextRequired || 0),
          },
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
      <div className="metrics-grid">
        {children}
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'No disponible'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function ensureMetaDescription() {
  const existing = document.querySelector('meta[name="description"]')
  if (existing) return existing

  const meta = document.createElement('meta')
  meta.setAttribute('name', 'description')
  document.head.appendChild(meta)
  return meta
}

export default FreeFirePrimeScanner

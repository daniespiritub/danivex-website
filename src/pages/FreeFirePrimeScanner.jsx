import { useEffect, useRef, useState } from 'react'
import { FaBalanceScale, FaBolt, FaRedo, FaShareAlt, FaShieldAlt } from 'react-icons/fa'
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
import { formatNumber, generateMockPlayer, scannerSteps } from '../data/primeScanner'
import '../styles/prime-scanner.css'

const seoTitle = 'Free Fire Prime AI Scanner - Analiza tu cuenta por UID'
const seoDescription = 'Consulta tu UID de Free Fire, nivel Prime, rareza, antigüedad estimada y análisis IA de tu cuenta.'

function FreeFirePrimeScanner() {
  const [uid, setUid] = useState('')
  const [region, setRegion] = useState('auto')
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [player, setPlayer] = useState(null)
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
    setIsLoading(true)
    setPlayer(null)
    setActionMessage('')
    setShowShareCard(false)
    setProgress(0)

    for (let index = 0; index < scannerSteps.length; index += 1) {
      setActiveStep(index)
      setProgress(Math.round(((index + 0.35) / scannerSteps.length) * 100))
      await wait(460 + index * 70)
    }

    const nextPlayer = generateMockPlayer(uid, region)
    setProgress(100)
    await wait(260)
    setPlayer(nextPlayer)
    setIsLoading(false)
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  function resetScanner() {
    setUid('')
    setPlayer(null)
    setActionMessage('')
    setShowShareCard(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function verifySanctions() {
    setActionMessage('Modo mock: no se detectan sanciones visibles para esta cuenta. En la fase API se validara contra fuentes reales disponibles.')
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
    setActionMessage('Tarjeta lista para screenshot. En la siguiente fase podemos generar imagen descargable automaticamente.')
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
          <span className="scanner-kicker">Nueva herramienta mock</span>
          <h1>Free Fire Prime AI Scanner</h1>
          <p>
            Ingresa tu UID y recibe una lectura visual de Prime, rareza, antiguedad estimada, perfil de gasto y analisis IA.
          </p>
        </div>

        <UIDSearchForm
          isLoading={isLoading}
          region={region}
          uid={uid}
          onRegionChange={setRegion}
          onSubmit={handleSubmit}
          onUidChange={setUid}
        />
      </section>

      {isLoading && <LoadingScanner activeStep={activeStep} progress={progress} />}

      {player && (
        <section className="scanner-results" ref={resultRef}>
          <PlayerProfileCard player={player} />

          <div className="scanner-grid two">
            <PrimeBadge prime={player.prime} />
            <PrimeProgress prime={player.prime} />
          </div>

          <div className="metrics-grid">
            <Metric label="Estimated Creation Date" value={formatDate(player.creationDate)} />
            <Metric label="Account Age" value={player.accountAge} />
            <Metric label="Account Rarity %" value={`${player.rarity}% ${player.rarityLabel}`} />
            <Metric label="OG Level" value={`${player.ogLevel}/10`} />
            <Metric label="Spending Profile" value={player.spendingProfile} />
            <Metric label="Diamantes estimados" value={formatNumber(player.prime.diamonds)} />
          </div>

          <div className="scanner-grid two">
            <PrimePrivileges level={player.prime.level} />
            <AIAnalysisCard analysis={player.aiAnalysis} />
          </div>

          <div className="scanner-actions" aria-label="Acciones del resultado">
            <button type="button" onClick={resetScanner}><FaRedo aria-hidden="true" /> Analizar otra cuenta</button>
            <button type="button" onClick={verifySanctions}><FaShieldAlt aria-hidden="true" /> Verificar sanciones</button>
            <button type="button" onClick={compareOgAccount}><FaBalanceScale aria-hidden="true" /> Comparar con cuenta OG</button>
            <button type="button" onClick={showShare}><FaShareAlt aria-hidden="true" /> Generar tarjeta para compartir</button>
            <button type="button" onClick={roastPlayer}><FaBolt aria-hidden="true" /> AI Gamer Roast</button>
          </div>

          {actionMessage && <p className="action-message">{actionMessage}</p>}
          {showShareCard && <ShareCard player={player} />}
        </section>
      )}
    </main>
  )
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
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

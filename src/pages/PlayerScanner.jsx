import { useEffect, useRef, useState } from 'react'
import { PiArrowClockwiseBold, PiCrownSimpleFill, PiShareNetworkBold, PiCrownBold } from 'react-icons/pi'
import ShareCard from '../components/prime-scanner/ShareCard'
import logo from '../assets/logo.webp'
import fondo from '../assets/fondo-gamer.webp'
import { formatNumber, generatePlayerFromLookup } from '../data/primeScanner'
import { buildDaniVexAiRead } from '../data/aiSummary'
import { comparePlayers, compareSummary } from '../data/compare'
import '../styles/prime-scanner.css'
import '../styles/player-scanner-visual.css'

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

const SECTIONS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'rangos', label: 'Rangos' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'historial', label: 'Historial' },
]

function PlayerScanner() {
  const [uid, setUid] = useState('')
  const [region, setRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPrimeLoading, setIsPrimeLoading] = useState(false)
  const [player, setPlayer] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showShareCard, setShowShareCard] = useState(false)
  const [cacheInfo, setCacheInfo] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [compareUid, setCompareUid] = useState('')
  const [comparePlayer, setComparePlayer] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  const [activeSection, setActiveSection] = useState('resumen')
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
    setActiveSection('resumen')

    // Pequeña espera para que el skeleton se perciba fluido (no bloqueante).
    await wait(120)

    const lookup = await lookupPlayer(cleanUid, region)
    const nextPlayer = generatePlayerFromLookup(cleanUid, lookup)

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
    window.setTimeout(() => document.querySelector('.share-card-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }

  function goToSection(id) {
    setActiveSection(id)
    document.getElementById(`ps-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const primeLevel = playerPrimeLevel(player)
  const outfit = Array.isArray(player?.outfit) ? player.outfit.filter((o) => o && o.image) : []
  const changes = timeline.slice(0, 10)

  return (
    <main className="scanner-page ps-page" style={{ backgroundImage: `url(${fondo})` }}>
      <header className="scanner-nav">
        <a className="scanner-brand" href="/">
          <img src={logo} alt="DaniVex" />
          <span>DANIVEX</span>
        </a>
        <a className="scanner-home-link" href="/">Volver al inicio</a>
      </header>

      <section className="scanner-hero ps-hero">
        <div className="scanner-hero-copy">
          <span className="scanner-kicker">Buscador de jugadores Free Fire</span>
          <h1>Player Scanner</h1>
          <p>Busca cualquier jugador por su UID y explora su perfil real: banner, avatar, Prime, rangos, clan, outfit e historial de cambios.</p>
        </div>

        <form className="uid-form ps-form" onSubmit={handleSubmit}>
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
          <select id="player-region-select" className="scanner-region-select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => <option key={r.value || 'auto'} value={r.value}>{r.label}</option>)}
          </select>
          <p className="uid-helper">El UID aparece en tu perfil de Free Fire, debajo del nick (6 a 12 digitos). La region se autodetecta.</p>
        </form>
      </section>

      {isLoading && <PlayerSkeleton />}

      {errorMessage && !isLoading && (!player || player.lookupStatus !== 'real') && (
        <p className="action-message warning ps-error">{errorMessage}</p>
      )}

      {player && player.lookupStatus === 'real' && !isLoading && (
        <div className="ps-result" ref={resultRef}>
          <PlayerCard player={player} primeLevel={primeLevel} outfit={outfit} changesCount={changes.length} onSeeHistory={() => goToSection('historial')} />

          {cacheInfo?.state === 'stale' && (
            <p className="action-message warning">
              Ultima informacion disponible: los proveedores no respondieron y DaniVex muestra el ultimo perfil guardado
              {cacheInfo.lastObservedAt ? ` (observado el ${formatDate(cacheInfo.lastObservedAt)})` : ''}.
            </p>
          )}

          <nav className="ps-nav" aria-label="Secciones del perfil">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" className={activeSection === s.id ? 'ps-chip active' : 'ps-chip'} onClick={() => goToSection(s.id)}>
                {s.label}
              </button>
            ))}
          </nav>

          {/* RESUMEN */}
          <section id="ps-resumen" className="ps-section">
            <h3 className="ps-h3">Resumen</h3>
            <div className="ps-summary-grid">
              <StatTile label="Nivel" value={player.level || '—'} />
              <StatTile label="Prime" value={primeLevel ? `Prime ${primeLevel}` : 'No disponible'} accent={Boolean(primeLevel)} />
              <StatTile label="Rango BR" value={rankFull(player.rankBR, player.rankBRDivision) || 'No disponible'} sub={player.rankBRPoints ? `${player.rankBRPoints} RP` : ''} />
              <StatTile label="Rango CS" value={rankFull(player.rankCS, player.rankCSDivision) || 'No disponible'} sub={player.rankCSStars ? `${player.rankCSStars} ★` : ''} />
              <StatTile label="Clan" value={player.clan || 'Sin clan'} />
              <StatTile label="Me gusta" value={formatNumber(player.likes || 0)} />
              {player.pet && <StatTile label="Mascota" value={player.pet} sub={player.petLevel ? `Nivel ${player.petLevel}` : ''} />}
              {changes.length > 0 && <StatTile label="Cambios detectados" value={String(changes.length)} sub="desde el ultimo escaneo" accent onClick={() => goToSection('historial')} />}
            </div>
          </section>

          {/* OUTFIT */}
          <section id="ps-outfit" className="ps-section">
            <h3 className="ps-h3">Outfit actual</h3>
            {outfit.length > 0 ? (
              <div className="ps-outfit">
                <div className="ps-outfit-hero">
                  {player.avatarUrl && <img className="ps-outfit-avatar" src={player.avatarUrl} alt="Avatar" loading="lazy" onError={hideImg} />}
                  <span className="ps-outfit-count">{outfit.length} piezas equipadas</span>
                </div>
                <div className="ps-loadout">
                  {outfit.map((item, i) => (
                    <div className="ps-slot" key={item.id || i} title={`Item ${item.id}`}>
                      <img src={item.image} alt={`Item equipado ${i + 1}`} loading="lazy" onError={hideSlot} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="ps-muted">Outfit visual no disponible para esta cuenta.</p>
            )}

            {player.petImage && (
              <div className="ps-pet-card">
                <img className="ps-pet-img" src={player.petImage} alt={player.pet || 'Mascota'} loading="lazy" onError={hideImg} />
                <div className="ps-pet-info">
                  <span className="ps-pet-label">Mascota</span>
                  <span className="ps-pet-name-lg">{player.pet || 'Mascota equipada'}</span>
                  {player.petLevel && <span className="ps-pet-lvl">Nivel {player.petLevel}</span>}
                </div>
              </div>
            )}
          </section>

          {/* RANGOS */}
          <section id="ps-rangos" className="ps-section">
            <h3 className="ps-h3">Rangos</h3>
            <div className="ps-ranks">
              <RankCard title="Battle Royale" tier={player.rankBR} division={player.rankBRDivision} metric={player.rankBRPoints} metricLabel="RP" season={player.season} />
              <RankCard title="Duelo de Escuadras" tier={player.rankCS} division={player.rankCSDivision} metric={player.rankCSStars} metricLabel="★" season="" note="Estrellas y temporada de CS no disponibles en la fuente" />
            </div>
          </section>

          {/* PERFIL */}
          <section id="ps-perfil" className="ps-section">
            <h3 className="ps-h3">Perfil detallado</h3>
            <div className="ps-detail-grid">
              <Detail label="UID" value={player.uid} />
              <Detail label="Region" value={player.region || 'No disponible'} />
              <Detail label="Nivel" value={player.level || 'No disponible'} />
              <Detail label="Experiencia" value={player.exp || 'No disponible'} />
              <Detail label="Me gusta" value={formatNumber(player.likes || 0)} />
              <Detail label="Cuenta creada" value={formatDate(player.creationDate)} />
              <Detail label="Antiguedad" value={player.accountAge || 'No disponible'} />
              <Detail label="Ultimo login" value={formatDate(player.lastLogin)} />
              <Detail label="Version" value={player.gameVersion || 'No disponible'} />
              <Detail label="Pase Booyah" value={player.pass || 'No disponible'} />
              {player.badgeCount && <Detail label="Insignias" value={player.badgeCount} />}
              {(player.clan || player.clanId) && <Detail label="Clan" value={player.clan || 'No disponible'} />}
              {player.clanLevel && <Detail label="Nivel clan" value={player.clanLevel} />}
              {player.clanMembers && <Detail label="Miembros clan" value={player.clanMembers} />}
              {player.clanLeader && <Detail label="Lider" value={player.clanLeader} />}
            </div>
            {player.bio && <div className="ps-bio"><strong>Biografia:</strong> {player.bio}</div>}
            <div className="ps-ai"><strong>Lectura DaniVex AI:</strong> {buildDaniVexAiRead(player, timeline)}</div>
            <p className="source-note">Fuente: {player.lookupProvider}. {player.cacheHit ? 'Servido desde la cache privada de DaniVex.' : 'Consulta nueva.'}</p>
          </section>

          {/* HISTORIAL */}
          <section id="ps-historial" className="ps-section">
            <h3 className="ps-h3">¿Que cambio?</h3>
            {changes.length > 0 ? (
              <div className="ps-history">
                {changes.map((event, i) => (
                  <div className="ps-change" key={`${event.at || i}-${event.type}`}>
                    <span className="ps-change-label">{EVENT_LABELS[event.type] || event.type}</span>
                    <span className="ps-change-val">{changeDetail(event)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ps-muted">Aun no hay cambios registrados. Vuelve a escanear mas adelante para construir el historial de este jugador.</p>
            )}
          </section>

          <div className="scanner-actions ps-actions" aria-label="Acciones del resultado">
            <button type="button" onClick={resetScanner}><PiArrowClockwiseBold aria-hidden="true" /> Buscar otro jugador</button>
            <button type="button" onClick={confirmPrime} disabled={isPrimeLoading}><PiCrownBold aria-hidden="true" /> {isPrimeLoading ? 'Consultando...' : 'Confirmar Prime'}</button>
            <button type="button" onClick={showShare}><PiShareNetworkBold aria-hidden="true" /> Compartir tarjeta</button>
          </div>

          {/* COMPARAR */}
          <div className="compare-panel">
            <h4>Comparar con otro jugador</h4>
            <form className="uid-form" onSubmit={runCompare}>
              <div className="uid-input-wrap">
                <input inputMode="numeric" maxLength={12} placeholder="UID a comparar" value={compareUid}
                  onChange={(e) => setCompareUid(e.target.value.replace(/[^\d]/g, '').slice(0, 12))} />
                <button type="submit" disabled={isComparing || compareUid.length < 6}>{isComparing ? 'Comparando...' : 'Comparar'}</button>
              </div>
            </form>
            {comparePlayer && comparePlayer.lookupStatus === 'real' && (
              <div className="compare-table">
                <div className="compare-row compare-head">
                  <span>Metrica</span><strong>{player.username}</strong><strong>{comparePlayer.username}</strong>
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

          {actionMessage && <p className="action-message">{actionMessage}</p>}
          {showShareCard && <ShareCard player={player} events={timeline} />}
        </div>
      )}
    </main>
  )
}

/* ---------- Componentes visuales ---------- */

function PlayerCard({ player, primeLevel, outfit, changesCount, onSeeHistory }) {
  return (
    <article className="pc">
      <div className="pc-banner-wrap" aria-hidden="true">
        {player.bannerUrl && (
          <img
            className="pc-banner-img"
            src={player.bannerUrl}
            alt=""
            data-fallback={player.bannerFallbackUrl || ''}
            onError={handleBannerError}
          />
        )}
      </div>
      <div className="pc-overlay" aria-hidden="true" />
      <div className="pc-body">
        <div className="pc-avatar-wrap">
          {player.avatarUrl
            ? <img className="pc-avatar" src={player.avatarUrl} alt={`Avatar de ${player.username}`} onError={hideImg} />
            : <span className="pc-avatar pc-avatar-fallback">{(player.username || '?').slice(0, 2)}</span>}
        </div>

        <div className="pc-identity">
          <h2 className="pc-name">{player.username}</h2>
          <div className="pc-chips">
            <span className="pc-chip">UID {player.uid}</span>
            <span className="pc-chip">{player.region || 'Region ?'}</span>
            {player.clan && <span className="pc-chip pc-chip-clan">Clan {player.clan}</span>}
          </div>

          <div className="pc-badges">
            <div className="pc-badge">
              <span className="pc-badge-k">Nivel</span>
              <span className="pc-badge-v">{player.level || '—'}</span>
            </div>
            {primeLevel && (
              <div className="pc-badge pc-badge-prime">
                <PiCrownSimpleFill aria-hidden="true" />
                <span className="pc-badge-v">Prime {primeLevel}</span>
              </div>
            )}
          </div>

          <div className="pc-ranks">
            <div className="pc-rank">
              <span className="pc-rank-mode">BR</span>
              <span className="pc-rank-tier">{rankFull(player.rankBR, player.rankBRDivision) || 'No disponible'}</span>
              {player.rankBRPoints && <span className="pc-rank-pts">{player.rankBRPoints} RP</span>}
            </div>
            <div className="pc-rank">
              <span className="pc-rank-mode">CS</span>
              <span className="pc-rank-tier">{rankFull(player.rankCS, player.rankCSDivision) || 'No disponible'}</span>
              {player.rankCSStars && <span className="pc-rank-pts">{player.rankCSStars} ★</span>}
            </div>
          </div>

          {changesCount > 0 && (
            <button type="button" className="pc-changes" onClick={onSeeHistory}>
              {changesCount} {changesCount === 1 ? 'cambio' : 'cambios'} desde el ultimo escaneo
            </button>
          )}
        </div>

        {(outfit.length > 0 || player.petImage) && (
          <div className="pc-loadout-wrap">
            {outfit.length > 0 && (
              <div className="pc-loadout" aria-label="Outfit equipado">
                {outfit.slice(0, 6).map((item, i) => (
                  <div className="pc-slot" key={item.id || i}>
                    <img src={item.image} alt={`Item equipado ${i + 1}`} loading="lazy" onError={hideSlot} />
                  </div>
                ))}
              </div>
            )}
            {player.petImage && (
              <div className="pc-pet" title={player.pet ? `Mascota: ${player.pet}${player.petLevel ? ` (Nv ${player.petLevel})` : ''}` : 'Mascota'}>
                <img src={player.petImage} alt={player.pet || 'Mascota'} loading="lazy" onError={hideImg} />
                {player.pet && <span className="pc-pet-name">{player.pet}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function PlayerSkeleton() {
  return (
    <div className="ps-result">
      <div className="pc pc-skeleton">
        <div className="pc-banner-wrap sk" />
        <div className="pc-body">
          <div className="pc-avatar-wrap"><div className="pc-avatar sk" /></div>
          <div className="pc-identity">
            <div className="sk sk-line" style={{ width: '55%', height: 26 }} />
            <div className="sk sk-line" style={{ width: '40%' }} />
            <div className="sk sk-line" style={{ width: '70%', height: 40, marginTop: 10 }} />
          </div>
        </div>
      </div>
      <div className="ps-summary-grid">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk sk-tile" />)}
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, accent, onClick }) {
  const Cmp = onClick ? 'button' : 'div'
  return (
    <Cmp type={onClick ? 'button' : undefined} className={`ps-tile${accent ? ' ps-tile-accent' : ''}${onClick ? ' ps-tile-btn' : ''}`} onClick={onClick}>
      <span className="ps-tile-label">{label}</span>
      <span className="ps-tile-value">{value}</span>
      {sub && <span className="ps-tile-sub">{sub}</span>}
    </Cmp>
  )
}

function RankCard({ title, tier, division, metric, metricLabel, season, note }) {
  const has = Boolean(tier)
  return (
    <div className={`ps-rankcard${has ? '' : ' ps-rankcard-empty'}`}>
      <span className="ps-rankcard-mode">{title}</span>
      <span className="ps-rankcard-tier">{rankFull(tier, division) || 'No disponible'}</span>
      <div className="ps-rankcard-meta">
        {metric && <span>{metricLabel === '★' ? `${metric} ★` : `${metric} ${metricLabel}`}</span>}
        {season && <span>Temporada {season}</span>}
      </div>
      {note && <span className="ps-rankcard-note">{note}</span>}
    </div>
  )
}

// Une tier + division ("Diamante" + "III" -> "Diamante III").
function rankFull(tier, division) {
  if (!tier) return ''
  return division ? `${tier} ${division}` : tier
}

function Detail({ label, value }) {
  return (
    <div className="ps-detail">
      <span className="ps-detail-k">{label}</span>
      <span className="ps-detail-v">{value}</span>
    </div>
  )
}

/* ---------- helpers ---------- */

const EVENT_LABELS = {
  NICKNAME_CHANGED: 'Nickname', LEVEL_UP: 'Subio de nivel', LEVEL_CHANGED: 'Nivel',
  LIKES_CHANGED: 'Me gusta', GUILD_CHANGED: 'Clan', AVATAR_CHANGED: 'Avatar',
  BANNER_CHANGED: 'Banner', BIO_CHANGED: 'Biografia', PRIME_CHANGED: 'Prime',
  REGION_CHANGED: 'Region', RANK_BR_CHANGED: 'Rango BR', RANK_CS_CHANGED: 'Rango CS',
  RANK_BR_RP_CHANGED: 'RP (BR)', RANK_CS_STARS_CHANGED: 'Estrellas (CS)',
  TITLE_CHANGED: 'Titulo', PET_CHANGED: 'Mascota', OUTFIT_CHANGED: 'Outfit',
}

function changeDetail(event) {
  const short = (s) => (String(s || '').length <= 26 ? String(s || '') : '')
  const from = short(event.from)
  const to = short(event.to)
  if (from || to) return `${from || '—'} → ${to || '—'}`
  return 'actualizado'
}

function playerPrimeLevel(player) {
  if (!player) return ''
  if (player.providerPrimeLevel) return String(player.providerPrimeLevel).replace(/[^\d]/g, '') || String(player.providerPrimeLevel)
  if (player.prime?.diamonds > 0) return String(player.prime.level)
  return ''
}

function hideImg(e) { e.currentTarget.style.display = 'none' }
// Banner: si la URL principal (proveedor) falla al renderizar, intenta el
// fallback por bannerId (catalogo jsDelivr, sin hotlink). Si tambien falla, se
// oculta y queda el fondo DaniVex del gradiente.
function handleBannerError(e) {
  const img = e.currentTarget
  const fb = img.getAttribute('data-fallback')
  if (fb && !img.dataset.usedFallback) {
    img.dataset.usedFallback = '1'
    img.src = fb
  } else {
    img.style.display = 'none'
  }
}
function hideSlot(e) { const p = e.currentTarget.closest('.ps-slot, .pc-slot'); if (p) p.style.display = 'none' }

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
  } catch { return [] }
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
    lookupProvider: player.lookupProvider?.includes('FreeFireJornal Prime') ? player.lookupProvider : `${player.lookupProvider || 'Perfil publico'} + FreeFireJornal Prime`,
    prime: { ...player.prime, level, points: diamonds, diamonds, isMax: level >= 8, source: primeLookup.sourceUrl || 'FreeFireJornal Prime' },
  }
}

function formatDate(value) {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function wait(ms) { return new Promise((resolve) => { window.setTimeout(resolve, ms) }) }

export default PlayerScanner

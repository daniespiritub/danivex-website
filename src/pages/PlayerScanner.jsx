import { useEffect, useRef, useState } from 'react'
import { PiArrowClockwiseBold, PiShareNetworkBold, PiCrownBold } from 'react-icons/pi'
import ShareCard from '../components/prime-scanner/ShareCard'
import logo from '../assets/logo.webp'
import fondo from '../assets/fondo-gamer.webp'
import { formatNumber, generatePlayerFromLookup } from '../data/primeScanner'
import { buildDaniVexAiRead } from '../data/aiSummary'
import { comparePlayers, compareSummary } from '../data/compare'
import { rankEmblemSrc } from '../data/rankEmblems'
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
  { id: 'estadisticas', label: 'Estadisticas' },
  { id: 'pases', label: 'Pases' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'historial', label: 'Historial' },
]

// ¿El jugador trae estadisticas reales de partidas? (BR o CS con datos)
function hasStats(player) {
  const s = player?.stats
  return Boolean(s && ((s.br && (s.br.solo || s.br.duo || s.br.squad)) || s.cs))
}

// ¿Hay coleccion de pases publicada para este UID?
function hasPasses(player) {
  const p = player?.passCollection
  return Boolean(p && ((p.elitePass && p.elitePass.length) || (p.booyahPass && p.booyahPass.length)))
}

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
  // Token de secuencia: latest-request-wins. Evita que una busqueda lenta de A
  // sobrescriba el resultado de una busqueda posterior de B (leakage/stale UI).
  const requestSeqRef = useRef(0)

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

    const seq = (requestSeqRef.current += 1) // esta busqueda es ahora la vigente

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
    // Si el usuario ya lanzo otra busqueda, descartar este resultado (no pisar B con A).
    if (seq !== requestSeqRef.current) return
    const nextPlayer = generatePlayerFromLookup(cleanUid, lookup)

    setPlayer(nextPlayer)
    setCacheInfo(lookup?.cache || null)
    setIsLoading(false)

    if (nextPlayer.lookupStatus !== 'real') {
      setErrorMessage(cleanErrorMessage(lookup))
    } else {
      fetchTimeline(cleanUid).then((t) => { if (seq === requestSeqRef.current) setTimeline(t) })
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
          <PlayerCard player={player} outfit={outfit} changesCount={changes.length} onSeeHistory={() => goToSection('historial')} />

          {cacheInfo?.state === 'stale' && (
            <p className="action-message warning">
              Ultima informacion disponible: los proveedores no respondieron y DaniVex muestra el ultimo perfil guardado
              {cacheInfo.lastObservedAt ? ` (observado el ${formatDate(cacheInfo.lastObservedAt)})` : ''}.
            </p>
          )}

          <nav className="ps-nav" aria-label="Secciones del perfil">
            {SECTIONS.filter((s) => (s.id !== 'estadisticas' || hasStats(player)) && (s.id !== 'pases' || hasPasses(player))).map((s) => (
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
              {(player.pet || player.petId) && <StatTile label="Mascota" value={player.pet || 'Mascota desconocida'} sub={player.petLevel ? `Nivel ${player.petLevel}` : ''} />}
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
                  <span className="ps-pet-name-lg">{player.pet || 'Mascota desconocida'}</span>
                  {player.petNickname && <span className="ps-pet-sub">Apodo: {player.petNickname}</span>}
                  {player.petSkinName && <span className="ps-pet-sub">Aspecto: {player.petSkinName}</span>}
                  {player.petLevel && <span className="ps-pet-lvl">Nivel {player.petLevel}</span>}
                </div>
              </div>
            )}
          </section>

          {/* RANGOS */}
          <section id="ps-rangos" className="ps-section">
            <h3 className="ps-h3">Rangos</h3>
            <div className="ps-ranks">
              <RankCard title="Battle Royale" mode="br" tier={player.rankBR} division={player.rankBRDivision} tierKey={player.rankBRTierKey} metric={player.rankBRPoints} metricLabel="RP" season={player.season} stars={player.rankBRStarLevel} toNext={player.rankBRPointsToNext} />
              <RankCard title="Duelo de Escuadras" mode="cs" tier={player.rankCS} division={player.rankCSDivision} tierKey={player.rankCSTierKey} metric={player.rankCSStars} metricLabel="★" season={player.rankCSSeason}
                note={player.rankCS ? '' : 'La fuente de datos no expone el rango, las estrellas ni la temporada de Duelo de Escuadras.'} />
            </div>
          </section>

          {/* ESTADISTICAS */}
          {hasStats(player) && (
            <section id="ps-estadisticas" className="ps-section">
              <h3 className="ps-h3">Estadisticas</h3>
              <StatsPanel stats={player.stats} />
            </section>
          )}

          {/* PASES */}
          {hasPasses(player) && (
            <section id="ps-pases" className="ps-section">
              <h3 className="ps-h3">Coleccion de Pases</h3>
              <PassCollection collection={player.passCollection} />
            </section>
          )}

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

function PlayerCard({ player, outfit, changesCount, onSeeHistory }) {
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
            {player.primeBadge && player.primeBadge.active && (
              <div className="pc-badge pc-badge-prime">
                <PrimeEmblem prime={player.primeBadge} size="sm" />
                <span className="pc-badge-v">Prime {player.primeBadge.level}</span>
              </div>
            )}
          </div>

          <div className="pc-ranks">
            <div className="pc-rank">
              <div className="pc-rank-top">
                <RankEmblem mode="br" tierKey={player.rankBRTierKey} size="sm" />
                <span className="pc-rank-mode">BR</span>
              </div>
              <span className="pc-rank-tier">{rankFull(player.rankBR, player.rankBRDivision) || 'No disponible'}</span>
              {player.rankBRPoints && <span className="pc-rank-pts">{player.rankBRPoints} RP</span>}
            </div>
            <div className="pc-rank">
              <div className="pc-rank-top">
                <RankEmblem mode="cs" tierKey={player.rankCSTierKey} size="sm" />
                <span className="pc-rank-mode">CS</span>
              </div>
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

function RankCard({ title, mode, tier, division, tierKey, metric, metricLabel, season, note, stars, toNext }) {
  const has = Boolean(tier)
  const starCount = Number(stars) || 0
  return (
    <div className={`ps-rankcard${has ? '' : ' ps-rankcard-empty'}`}>
      <span className="ps-rankcard-mode">{title}</span>
      <div className="ps-rankcard-head">
        {tierKey && <RankEmblem mode={mode} tierKey={tierKey} size="lg" />}
        <span className="ps-rankcard-tier">{rankFull(tier, division) || 'No disponible'}</span>
      </div>
      {starCount > 0 && (
        <span className="ps-rankcard-stars" aria-label={`${starCount} de 5 estrellas`}>
          {'★'.repeat(starCount)}<span className="ps-rankcard-stars-off">{'★'.repeat(Math.max(0, 5 - starCount))}</span>
        </span>
      )}
      <div className="ps-rankcard-meta">
        {metric && <span>{metricLabel === '★' ? `${metric} ★` : `${metric} ${metricLabel}`}</span>}
        {season && <span>Temporada {season}</span>}
      </div>
      {toNext ? <span className="ps-rankcard-note">Faltan {toNext} RP para el próximo escalón</span> : note && <span className="ps-rankcard-note">{note}</span>}
    </div>
  )
}

// Panel de estadisticas REALES de partidas. Muestra el scope CARRERA (acumulado)
// y, si existe, CLASIFICATORIA (ranked) por separado y bien etiquetado. Solo
// bloques con datos; nunca campos vacios. Datos reales de SiamBhau (no son una
// captura concreta del juego: son acumulados por scope).
function StatsScope({ br, cs }) {
  const brModes = [
    ['Solo', br?.solo],
    ['Duo', br?.duo],
    ['Escuadra', br?.squad],
  ].filter(([, m]) => m)
  if (brModes.length === 0 && !cs) return null
  return (
    <div className="ps-stats">
      {brModes.length > 0 && (
        <div className="ps-stats-group">
          <span className="ps-stats-mode-label">Battle Royale</span>
          <div className="ps-stats-cards">
            {brModes.map(([label, m]) => (
              <StatModeCard key={label} title={label} mode="br" m={m} />
            ))}
          </div>
        </div>
      )}
      {cs && (
        <div className="ps-stats-group">
          <span className="ps-stats-mode-label">Duelo de Escuadras</span>
          <div className="ps-stats-cards">
            <StatModeCard title="Clash Squad" mode="cs" m={cs} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatsPanel({ stats }) {
  if (!stats) return null
  const ranked = stats.ranked
  const hasRanked = ranked && ((ranked.br && (ranked.br.solo || ranked.br.duo || ranked.br.squad)) || ranked.cs)
  return (
    <div className="ps-stats-scopes">
      <div className="ps-stats-scope">
        <span className="ps-stats-scope-label">Carrera <em>(acumulado)</em></span>
        <StatsScope br={stats.br} cs={stats.cs} />
      </div>
      {hasRanked && (
        <div className="ps-stats-scope">
          <span className="ps-stats-scope-label">Clasificatoria <em>(ranked)</em></span>
          <StatsScope br={ranked.br} cs={ranked.cs} />
        </div>
      )}
    </div>
  )
}

function StatModeCard({ title, mode, m }) {
  const rows = mode === 'cs'
    ? [
        ['Partidas', formatNumber(m.matches)],
        ['Victorias', formatNumber(m.wins)],
        ['Win rate', `${m.winRate}%`],
        ['Eliminaciones', formatNumber(m.kills)],
        ['K/D', m.kd],
        ['KDA', m.kda],
        ['MVP', formatNumber(m.mvp)],
        ['Daño medio', formatNumber(m.avgDamage)],
        ['Headshots', formatNumber(m.headshotKills)],
        ['HS %', `${m.hsRate}%`],
        ['Derribos', formatNumber(m.knockdowns)],
      ]
    : [
        ['Partidas', formatNumber(m.matches)],
        ['Victorias', formatNumber(m.wins)],
        ['Win rate', `${m.winRate}%`],
        ['Eliminaciones', formatNumber(m.kills)],
        ['K/D', m.kd],
        ['Daño medio', formatNumber(m.avgDamage)],
        ['HS %', `${m.hsRate}%`],
        ['Max kills', formatNumber(m.highestKills)],
      ]
  return (
    <div className="ps-statcard">
      <span className="ps-statcard-title">{title}</span>
      <div className="ps-statcard-grid">
        {rows.map(([k, v]) => (
          <div className="ps-statcell" key={k}>
            <span className="ps-statcell-v">{v}</span>
            <span className="ps-statcell-k">{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Coleccion de Pases: catalogo historico + posesion real. Adquirido = dorado;
// No adquirido = gris/desaturado. El estado NO depende solo del color (label +
// aria-label + icono). Filtros por sistema (Elite/Booyah) y por estado.
function PassFilterChip({ active, onClick, children }) {
  return <button type="button" className={active ? 'ps-passfilter active' : 'ps-passfilter'} onClick={onClick}>{children}</button>
}

function PassCollection({ collection }) {
  const [sys, setSys] = useState('all') // all | elite-pass | booyah-pass
  const [own, setOwn] = useState('all') // all | owned | not-owned
  if (!collection) return null
  const c = collection.counts || {}
  const all = [...(collection.booyahPass || []), ...(collection.elitePass || [])]
  const list = all
    .filter((p) => sys === 'all' || p.system === sys)
    .filter((p) => own === 'all' || (own === 'owned' ? p.owned : !p.owned))
    .sort((a, b) => b.num - a.num)
  return (
    <div className="ps-passes">
      <div className="ps-pass-counts">
        <span className="ps-pass-count"><strong>{(c.eliteOwned || 0) + (c.booyahOwned || 0)}</strong> / {(c.eliteTotal || 0) + (c.booyahTotal || 0)} adquiridos</span>
        <span className="ps-pass-count ps-pass-count-elite">Pase de Élite {c.eliteOwned || 0}/{c.eliteTotal || 0}</span>
        <span className="ps-pass-count ps-pass-count-booyah">Pase Booyah {c.booyahOwned || 0}/{c.booyahTotal || 0}</span>
      </div>
      <div className="ps-pass-filters">
        <div className="ps-passfilter-group">
          <PassFilterChip active={sys === 'all'} onClick={() => setSys('all')}>Todos</PassFilterChip>
          <PassFilterChip active={sys === 'elite-pass'} onClick={() => setSys('elite-pass')}>Élite</PassFilterChip>
          <PassFilterChip active={sys === 'booyah-pass'} onClick={() => setSys('booyah-pass')}>Booyah</PassFilterChip>
        </div>
        <div className="ps-passfilter-group">
          <PassFilterChip active={own === 'all'} onClick={() => setOwn('all')}>Todos</PassFilterChip>
          <PassFilterChip active={own === 'owned'} onClick={() => setOwn('owned')}>Adquiridos</PassFilterChip>
          <PassFilterChip active={own === 'not-owned'} onClick={() => setOwn('not-owned')}>No adquiridos</PassFilterChip>
        </div>
      </div>
      <div className="ps-pass-grid">
        {list.map((p) => (
          <div key={p.id} className={`ps-passcard${p.owned ? ' owned' : ' not-owned'}`}
            aria-label={`${p.name} · ${p.system === 'elite-pass' ? 'Pase de Élite' : 'Pase Booyah'} · ${p.owned ? 'Adquirido' : 'No adquirido'}`}>
            <div className="ps-passcard-img">
              <img src={p.image} alt="" aria-hidden="true" loading="lazy" width="72" height="72"
                onError={(e) => { const ph = e.currentTarget.parentElement; if (ph) { e.currentTarget.style.display = 'none'; ph.classList.add('ps-passcard-noimg'); ph.dataset.n = '#' + p.num } }} />
              {p.owned && <span className="ps-passcard-check" aria-hidden="true">✓</span>}
            </div>
            <span className="ps-passcard-name" title={p.name}>{p.name}</span>
            <span className="ps-passcard-state">{p.owned ? 'Adquirido' : 'No adquirido'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Emblema de rango: intenta el PNG OFICIAL self-hosted (/ff-emblems) y, si no
// existe o falla la carga, cae al badge de color CSS (fallback). El emblema
// oficial es el asset real del juego (guía oficial de rangos de Garena).
function RankEmblem({ mode, tierKey, size = 'sm' }) {
  const [failed, setFailed] = useState(false)
  if (!tierKey) return null
  const src = rankEmblemSrc(mode, tierKey)
  const badgeCls = `ps-emblem${size === 'sm' ? ' ps-emblem-sm' : ''} ps-emblem-${tierKey}`
  if (!src || failed) {
    return <span className={badgeCls} aria-hidden="true">{emblemInitial(tierKey)}</span>
  }
  const imgCls = `ps-emblem-img${size === 'sm' ? ' ps-emblem-img-sm' : ''}`
  return <img className={imgCls} src={src} alt="" aria-hidden="true" loading="lazy" onError={() => setFailed(true)} />
}

// Emblema de Prime por NIVEL (DaniVex, SVG). Distinto por nivel (gradiente de tier +
// numero). El asset oficial FF_UI_PrimeBadage no tiene fuente publica no-gated; si
// prime.emblemUrl llega (fuente futura), se usa la imagen oficial. Nivel 0 => nada.
function PrimeEmblem({ prime, size = 'md' }) {
  if (!prime || !prime.active) return null
  if (prime.emblemUrl) {
    return <img className={`ps-prime-emblem ps-prime-${size}`} src={prime.emblemUrl} alt="" aria-hidden="true" loading="lazy" />
  }
  const t = prime.tier || {}
  const gid = `pg-${prime.level}`
  return (
    <svg className={`ps-prime-emblem ps-prime-${size}`} viewBox="0 0 40 44" role="img" aria-label={`Prime ${prime.level}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.c1 || '#f2c230'} />
          {t.c3 && <stop offset="50%" stopColor={t.c3} />}
          <stop offset="100%" stopColor={t.c2 || '#b8890c'} />
        </linearGradient>
      </defs>
      <path d="M20 1.5 L37 9 V24.5 C37 33.5 29 39.5 20 42.5 C11 39.5 3 33.5 3 24.5 V9 Z" fill={`url(#${gid})`} stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{prime.level}</text>
      <text x="20" y="36" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="rgba(255,255,255,0.92)" letterSpacing="0.6">PRIME</text>
    </svg>
  )
}

// Inicial para el badge de tier (DaniVex, fallback cuando no hay PNG oficial).
function emblemInitial(key) {
  const map = { grandmaster: 'GM', master: 'M', heroic: 'H', diamond: 'D', platinum: 'P', gold: 'O', silver: 'S', bronze: 'B' }
  return map[key] || '?'
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

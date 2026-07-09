import { formatNumber } from '../../data/primeScanner'

function ShareCard({ player }) {
  const rarityPercent = calculateRarityPercent(player)

  const primeText =
    player?.prime?.diamonds > 0
      ? `Prime ${player.prime.level}`
      : 'No confirmado'

  const primePoints =
    player?.prime?.diamonds > 0
      ? `${formatNumber(player.prime.diamonds)} pts`
      : 'No confirmado'

  const likesText =
    Number(player?.likes || 0) > 0
      ? formatNumber(player.likes)
      : 'No disponible'

  return (
    <div className="share-card-wrap">
      <div
        className="share-card"
        style={{
          maxWidth: 680,
          borderRadius: 18,
          padding: 18,
          border: '1px solid var(--accent2-line)',
          background: 'var(--surface)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          color: 'var(--text)',
        }}
      >
        {/* HEADER SIN BANNER - ESTILO PERFIL SUPERIOR */}
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            marginBottom: 18,
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--accent2)',
                background: 'linear-gradient(135deg, var(--accent2-strong), var(--accent2))',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--accent2-text)',
                fontWeight: 900,
                fontSize: 28,
              }}
            >
              {player?.avatar ? (
                <img
                  src={player.avatar}
                  alt={player?.username || 'avatar'}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                getInitial(player?.username)
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  color: 'var(--accent2)',
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                DaniVex Free Fire Profile
              </span>

              <h3
                style={{
                  margin: 0,
                  fontSize: 36,
                  lineHeight: 1,
                  color: 'var(--text)',
                  wordBreak: 'break-word',
                }}
              >
                {player?.username || 'Cuenta Free Fire'}
              </h3>

              <p
                style={{
                  margin: '8px 0 0',
                  color: 'var(--text-muted)',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                UID {player?.uid || 'N/A'} - {player?.region || 'SAC'}
              </p>

              <p
                style={{
                  margin: '10px 0 0',
                  color: 'var(--text)',
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                {likesText} likes - Nivel {player?.level || 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        <SectionTitle title="Prime scan" />

        <ShareRow label={primeText} value={primePoints} highlight />
        <ShareRow label="Rareza" value={`${rarityPercent}%`} />
        <ShareRow label="Likes" value={likesText} />
        <ShareRow label="Nivel de cuenta" value={formatValue(player?.level)} />

        <SectionTitle title="Perfil publico" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <MiniBox label="Nombre" value={player?.username} />
          <MiniBox label="UID" value={player?.uid} />
          <MiniBox label="Region" value={player?.region} />
          <MiniBox label="Cuenta creada" value={player?.creationDate} />
          <MiniBox label="Ultimo login" value={player?.lastLogin} />
          <MiniBox label="Version" value={player?.gameVersion} />
          <MiniBox label="EXP" value={player?.exp} />
          <MiniBox label="Pase Booyah" value={player?.pass} />
          <MiniBox label="Clan" value={player?.clan} />
          <MiniBox label="Clan ID" value={player?.clanId} />
          <MiniBox label="Clan level" value={player?.clanLevel} />
          <MiniBox label="Miembros" value={player?.clanMembers} />
          <MiniBox label="Skin" value={player?.skinStatus} />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 900,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Biografia
          </span>

          <strong
            style={{
              lineHeight: 1.4,
              fontSize: 15,
              color: 'var(--text)',
              wordBreak: 'break-word',
            }}
          >
            {player?.bio || 'Sin biografia publica'}
          </strong>
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            color: 'var(--text-faint)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span>DaniVex AI Scanner</span>
          <span>{player?.lookupProvider || 'FreeFireMania'}</span>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <h4
      style={{
        margin: '14px 0 10px',
        color: 'var(--accent2)',
        fontSize: 15,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}
    >
      {title}
    </h4>
  )
}

function ShareRow({ label, value, highlight = false }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '12px 14px',
        marginBottom: 10,
        borderRadius: 10,
        border: highlight ? '1px solid var(--accent2-line)' : '1px solid var(--border)',
        background: highlight ? 'var(--accent2-soft)' : 'var(--surface-sunken)',
      }}
    >
      <span
        style={{
          fontWeight: 900,
          color: highlight ? 'var(--accent2)' : 'var(--text-muted)',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: 16,
          color: 'var(--text)',
          textAlign: 'right',
        }}
      >
        {value || 'No disponible'}
      </strong>
    </div>
  )
}

function MiniBox({ label, value }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border)',
        minHeight: 62,
      }}
    >
      <span
        style={{
          display: 'block',
          color: 'var(--text-muted)',
          fontSize: 12,
          fontWeight: 900,
          marginBottom: 5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: 'var(--text)',
          fontSize: 14,
          lineHeight: 1.25,
          wordBreak: 'break-word',
        }}
      >
        {formatValue(value)}
      </strong>
    </div>
  )
}

function calculateRarityPercent(player) {
  const level = Number(player?.level || 0)
  const likes = Number(player?.likes || 0)
  const primeLevel = Number(player?.prime?.level || 0)
  const diamonds = Number(player?.prime?.diamonds || 0)
  const hasOldDate = hasOldCreationDate(player?.creationDate)
  const hasClan = Boolean(player?.clan && player.clan !== '-')
  const hasBio = Boolean(player?.bio && String(player.bio).trim())

  let score = 0

  if (level >= 80) score += 25
  else if (level >= 70) score += 20
  else if (level >= 60) score += 15
  else if (level >= 50) score += 10

  if (likes >= 15000) score += 20
  else if (likes >= 10000) score += 16
  else if (likes >= 5000) score += 11
  else if (likes >= 1000) score += 6

  if (primeLevel >= 8 || diamonds >= 200000) score += 30
  else if (primeLevel >= 7 || diamonds >= 120000) score += 24
  else if (primeLevel >= 6 || diamonds >= 60000) score += 18
  else if (primeLevel >= 4 || diamonds >= 10000) score += 12
  else if (primeLevel >= 1 || diamonds >= 100) score += 6

  if (hasOldDate) score += 15
  if (hasClan) score += 5
  if (hasBio) score += 5

  return Math.max(0, Math.min(100, score))
}

function hasOldCreationDate(value) {
  const text = String(value || '').toLowerCase()

  return (
    text.includes('2017') ||
    text.includes('2018') ||
    text.includes('2019') ||
    text.includes('2020')
  )
}

function getInitial(name) {
  const clean = String(name || '').trim()
  return clean ? clean.charAt(0).toUpperCase() : 'FF'
}

function formatValue(value) {
  if (value === 0) return '0'
  if (!value) return 'No disponible'
  return String(value)
}

export default ShareCard

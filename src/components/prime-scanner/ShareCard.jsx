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
          border: '1px solid rgba(255, 204, 0, 0.55)',
          background:
            'linear-gradient(135deg, rgba(9, 15, 40, 0.98), rgba(65, 10, 28, 0.95))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          color: '#fff',
        }}
      >
        {/* HEADER SIN BANNER - ESTILO PERFIL SUPERIOR */}
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            marginBottom: 18,
            background:
              'linear-gradient(135deg, rgba(10,20,60,0.92), rgba(30,0,50,0.9))',
            border: '1px solid rgba(255,215,0,0.28)',
            boxShadow: 'inset 0 0 30px rgba(255, 215, 0, 0.04)',
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
                border: '3px solid #ffd700',
                background:
                  'linear-gradient(135deg, rgba(255, 75, 43, 0.95), rgba(245, 180, 0, 0.95))',
                boxShadow: '0 0 25px rgba(255,215,0,0.35)',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
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
                  color: '#ffdf38',
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                ⚡ DANIVEX FREE FIRE PROFILE
              </span>

              <h3
                style={{
                  margin: 0,
                  fontSize: 36,
                  lineHeight: 1,
                  color: '#fff',
                  wordBreak: 'break-word',
                }}
              >
                {player?.username || 'Cuenta Free Fire'}
              </h3>

              <p
                style={{
                  margin: '8px 0 0',
                  color: 'rgba(255,255,255,0.78)',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                UID {player?.uid || 'N/A'} • {player?.region || 'SAC'}
              </p>

              <p
                style={{
                  margin: '10px 0 0',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                ❤️ {likesText} Likes • 🏷️ Nivel {player?.level || 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        <SectionTitle title="👑 Prime Scan" />

        <ShareRow icon="👑" label={primeText} value={primePoints} highlight />
        <ShareRow icon="💎" label="Rareza" value={`${rarityPercent}%`} />
        <ShareRow icon="❤️" label="Likes" value={likesText} />
        <ShareRow icon="🏷️" label="Nivel de cuenta" value={formatValue(player?.level)} />

        <SectionTitle title="📋 Perfil FreeFireMania" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <MiniBox label="👤 Nombre" value={player?.username} />
          <MiniBox label="🆔 UID" value={player?.uid} />
          <MiniBox label="🌎 Región" value={player?.region} />
          <MiniBox label="📅 Cuenta creada" value={player?.creationDate} />
          <MiniBox label="🕒 Último login" value={player?.lastLogin} />
          <MiniBox label="🎮 Versión" value={player?.gameVersion} />
          <MiniBox label="📊 EXP" value={player?.exp} />
          <MiniBox label="🎟️ Pase Booyah" value={player?.pass} />
          <MiniBox label="🛡️ Clan" value={player?.clan} />
          <MiniBox label="🧬 Clan ID" value={player?.clanId} />
          <MiniBox label="🏰 Clan Level" value={player?.clanLevel} />
          <MiniBox label="👥 Miembros" value={player?.clanMembers} />
          <MiniBox label="🎭 Skin" value={player?.skinStatus} />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(6, 10, 30, 0.42)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 900,
              color: '#9fd0ff',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            📝 Biografía
          </span>

          <strong
            style={{
              lineHeight: 1.4,
              fontSize: 15,
              color: '#fff',
              wordBreak: 'break-word',
            }}
          >
            {player?.bio || 'Sin biografía pública'}
          </strong>
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            color: 'rgba(255,255,255,0.68)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span>⚡ DaniVex AI Scanner</span>
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
        color: '#ffdf38',
        fontSize: 15,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}
    >
      {title}
    </h4>
  )
}

function ShareRow({ icon, label, value, highlight = false }) {
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
        border: highlight
          ? '1px solid rgba(255, 204, 0, 0.55)'
          : '1px solid rgba(255,255,255,0.06)',
        background: highlight
          ? 'rgba(255, 183, 0, 0.16)'
          : 'rgba(6, 10, 30, 0.42)',
      }}
    >
      <span
        style={{
          fontWeight: 900,
          color: highlight ? '#ffdf38' : 'rgba(255,255,255,0.88)',
        }}
      >
        {icon} {label}
      </span>

      <strong
        style={{
          fontSize: 16,
          color: '#fff',
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
        background: 'rgba(6, 10, 30, 0.42)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 62,
      }}
    >
      <span
        style={{
          display: 'block',
          color: '#9fd0ff',
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
          color: '#fff',
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

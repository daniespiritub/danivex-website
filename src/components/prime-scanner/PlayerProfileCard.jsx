import { FaCheckCircle, FaMapMarkerAlt, FaUserShield } from 'react-icons/fa'

function PlayerProfileCard({ player }) {
  return (
    <article className="player-card scanner-panel">
      <div className="player-avatar" style={{ '--avatar-hue': `${player.avatarSeed % 360}deg` }}>
        <span>{player.username.slice(0, 2)}</span>
      </div>

      <div className="player-main">
        <span className="scanner-kicker">Cuenta escaneada</span>
        <h2>{player.username}</h2>
        <p className="player-name-source">
          {player.nameSource === 'manual' ? 'Nombre ingresado exactamente' : 'Nombre pendiente de API real'}
        </p>
        <div className="player-tags">
          <span><FaUserShield aria-hidden="true" /> UID {player.uid}</span>
          <span><FaMapMarkerAlt aria-hidden="true" /> {player.region} - {player.regionSource}</span>
          <span><FaCheckCircle aria-hidden="true" /> {player.status}</span>
        </div>
      </div>
    </article>
  )
}

export default PlayerProfileCard

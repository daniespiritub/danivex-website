function ShareCard({ player }) {
  return (
    <section className="share-card-wrap" aria-label="Tarjeta compartible">
      <div className="share-card">
        <div className="share-card-top">
          <div className="player-avatar compact" style={{ '--avatar-hue': `${player.avatarSeed % 360}deg` }}>
            <span>{player.username.slice(0, 2)}</span>
          </div>
          <div>
            <span>DaniVex Prime Scan</span>
            <h2>{player.username}</h2>
            <p>UID {player.uid} - {player.region}</p>
          </div>
        </div>

        <div className="share-prime-pill">
          <span>Prime {player.prime.level}</span>
          <strong>{player.prime.points.toLocaleString('en-US')} pts</strong>
        </div>

        <div className="share-metrics">
          <span>Rareza <strong>{player.rarity}%</strong></span>
          <span>OG Level <strong>{player.ogLevel}/10</strong></span>
          <span>Perfil <strong>{player.spendingProfile}</strong></span>
        </div>
      </div>
    </section>
  )
}

export default ShareCard

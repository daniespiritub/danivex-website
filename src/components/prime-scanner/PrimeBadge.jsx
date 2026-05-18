import { FaCrown } from 'react-icons/fa'
import { formatNumber } from '../../data/primeScanner'

function PrimeBadge({ prime }) {
  const assetPath = `/prime/prime-${prime.level}.png`

  return (
    <article className="prime-badge scanner-panel" data-prime-asset={assetPath}>
      <div className="prime-badge-mark" aria-label={`Prime ${prime.level}`}>
        <FaCrown aria-hidden="true" />
        <strong>{prime.level}</strong>
      </div>

      <div>
        <span className="scanner-kicker">Prime Level</span>
        <h2>Prime Level {prime.level}</h2>
        <p>{formatNumber(prime.points)} Prime Points</p>
        <small>{formatNumber(prime.currentFloor)}+ diamonds purchased</small>
      </div>
    </article>
  )
}

export default PrimeBadge

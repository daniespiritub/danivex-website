import { PiCrownBold } from 'react-icons/pi'
import { formatNumber } from '../../data/primeScanner'

function PrimeBadge({ prime }) {
  const assetPath = `/prime/prime-${prime.level}.png`

  return (
    <article className="prime-badge scanner-panel" data-prime-asset={assetPath}>
      <div className="prime-badge-mark" aria-label={`Prime ${prime.level}`}>
        <PiCrownBold aria-hidden="true" />
        <strong>{prime.level}</strong>
      </div>

      <div>
        <h2>Prime Level {prime.level}</h2>
        <p>{formatNumber(prime.points)} Prime Points</p>
        <small>{formatNumber(prime.currentFloor)}+ diamonds purchased</small>
      </div>
    </article>
  )
}

export default PrimeBadge

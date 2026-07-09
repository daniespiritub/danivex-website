import { formatNumber } from '../../data/primeScanner'

function PrimeProgress({ prime }) {
  const next = prime.next
  const max = next?.points || prime.points
  const min = prime.currentFloor
  const progress = next ? ((prime.points - min) / (max - min)) * 100 : 100

  return (
    <article className="prime-progress scanner-panel">
      <div className="scanner-panel-head">
        <div>
          <h3>Progreso Prime {prime.level}</h3>
        </div>
        <strong>{Math.round(progress)}%</strong>
      </div>

      <div className="prime-progress-bar">
        <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>

      <p>
        {formatNumber(prime.points)} / {formatNumber(max)} points
        {next ? ` - Next level: Prime ${next.level}` : ' - Max level reached'}
      </p>
    </article>
  )
}

export default PrimeProgress

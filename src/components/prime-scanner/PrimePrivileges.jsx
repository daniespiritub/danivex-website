import { PiDiamondBold } from 'react-icons/pi'
import { formatNumber, primeLevels } from '../../data/primeScanner'

function PrimePrivileges({ level }) {
  return (
    <article className="prime-privileges scanner-panel">
      <div className="scanner-panel-head">
        <div>
          <h3>Niveles, recompensas y privilegios</h3>
        </div>
      </div>

      <div className="prime-table">
        {primeLevels.map((item) => (
          <div className={item.level === level ? 'active' : ''} key={item.level}>
            <span>Prime {item.level}</span>
            <strong>{formatNumber(item.points)} pts</strong>
            <small>{formatNumber(item.diamonds)} diamantes</small>
          </div>
        ))}
      </div>

      <ul className="privilege-list">
        {primeLevels.find((item) => item.level === level)?.privileges.map((item) => (
          <li key={item}>
            <PiDiamondBold aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="source-note">
        Base mock preparada con la regla oficial: 1 diamante recargado = 1 Prime Point. Fuente: {' '}
        <a
          href="https://ffsoporte.garena.com/hc/es-419/articles/47644222087961-Sistema-Prime-Niveles-Recompensas-y-Privilegios"
          target="_blank"
          rel="noreferrer"
        >
          Garena Free Fire Support
        </a>.
      </p>
    </article>
  )
}

export default PrimePrivileges

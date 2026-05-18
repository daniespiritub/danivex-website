import { FaRobot } from 'react-icons/fa'

function AIAnalysisCard({ analysis }) {
  return (
    <article className="ai-card scanner-panel">
      <div className="scanner-panel-head">
        <div>
          <span className="scanner-kicker">Analisis IA</span>
          <h3>Lectura de cuenta</h3>
        </div>
        <FaRobot aria-hidden="true" />
      </div>
      <p>{analysis}</p>
    </article>
  )
}

export default AIAnalysisCard

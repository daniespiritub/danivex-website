import { PiRobotBold } from 'react-icons/pi'

function AIAnalysisCard({ analysis }) {
  return (
    <article className="ai-card scanner-panel">
      <div className="scanner-panel-head">
        <div>
          <h3>Analisis IA de la cuenta</h3>
        </div>
        <PiRobotBold aria-hidden="true" />
      </div>
      <p>{analysis}</p>
    </article>
  )
}

export default AIAnalysisCard

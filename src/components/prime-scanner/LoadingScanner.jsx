import { scannerSteps } from '../../data/primeScanner'

function LoadingScanner({ activeStep, progress }) {
  return (
    <div className="loading-scanner" role="status" aria-live="polite">
      <div className="scanner-orbit">
        <span />
        <strong>AI</strong>
      </div>

      <div className="loading-copy">
        <h2>Escaneo Prime en progreso</h2>
        <p>{scannerSteps[activeStep] || scannerSteps[0]}</p>
      </div>

      <div className="scanner-progress-track" aria-label="Progreso del escaneo">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="loading-steps">
        {scannerSteps.map((step, index) => (
          <span className={index <= activeStep ? 'done' : ''} key={step}>{step}</span>
        ))}
      </div>
    </div>
  )
}

export default LoadingScanner

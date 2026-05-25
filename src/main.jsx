import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function clearStaleBrowserState() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(
          registrations.map((registration) => registration.unregister()),
        ))
        .catch(() => {})
    })
  }

  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {})
  }

  try {
    window.localStorage.clear()
    window.sessionStorage.clear()
  } catch {
    // Storage can be unavailable in private modes or strict browser settings.
  }
}

clearStaleBrowserState()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

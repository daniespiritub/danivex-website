import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Version del "purge": subir este valor cuando un deploy necesite forzar la
// limpieza de service workers / caches viejos en los navegadores. La purga
// corre UNA sola vez por version (no en cada carga), asi el storage de la app
// (dedup de sesion del contador, futuras preferencias) deja de perderse.
const SW_PURGE_VERSION = '2026.09.11'
const SW_PURGE_KEY = 'danivex:sw-purge'

// Desregistra service workers y borra caches heredados de builds anteriores.
// Idempotente y a prueba de fallos: nunca toca localStorage/sessionStorage.
function purgeStaleServiceWorkers() {
  let already = null
  try {
    already = window.localStorage.getItem(SW_PURGE_KEY)
  } catch {
    // Storage puede no estar disponible (modo privado / ajustes estrictos).
  }
  if (already === SW_PURGE_VERSION) return

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(
        registrations.map((registration) => registration.unregister()),
      ))
      .catch(() => {})
  }

  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {})
  }

  try {
    window.localStorage.setItem(SW_PURGE_KEY, SW_PURGE_VERSION)
  } catch {
    // Si no se puede persistir, la purga reintentara en la proxima carga.
  }
}

purgeStaleServiceWorkers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

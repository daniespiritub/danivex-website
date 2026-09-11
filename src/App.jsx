import { useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import PlayerScanner from './pages/PlayerScanner.jsx'
import NotFound from './components/NotFound.jsx'
import { applySeo, SEO } from './utils/seo.js'
import './App.css'

// Rutas viejas del Prime Scanner: redirigen al Player Scanner (ademas del
// redirect 308 en vercel.json, este cubre navegacion en cliente / dev).
const LEGACY_SCANNER_PATHS = new Set(['/free-fire-prime-scanner', '/prime-scanner'])

// Resuelve la ruta actual a una vista conocida. Todo lo que no matchea una
// ruta valida cae en 'notFound' (evita el soft-404 que servia la home en
// cualquier URL basura).
function resolveRoute(pathname) {
  const path = pathname.replace(/\/$/, '')
  if (path === '') return 'home'
  if (LEGACY_SCANNER_PATHS.has(path)) return 'legacyScanner'
  if (path === '/player-scanner') return 'player'
  if (/^\/cuenta\/\d+\.html$/.test(path)) return 'player'
  return 'notFound'
}

function App() {
  const route = resolveRoute(window.location.pathname)

  useEffect(() => {
    if (route === 'legacyScanner') {
      window.location.replace('/player-scanner')
      return
    }
    applySeo(
      route === 'player' ? SEO.playerScanner
        : route === 'notFound' ? SEO.notFound
          : SEO.home,
    )
  }, [route])

  if (route === 'legacyScanner') return null
  if (route === 'player') return <PlayerScanner />
  if (route === 'notFound') return <NotFound />

  return <HomePage />
}

export default App

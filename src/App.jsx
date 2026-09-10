import { useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import FreeFirePrimeScanner from './pages/FreeFirePrimeScanner'
import NotFound from './components/NotFound.jsx'
import { applySeo, SEO } from './utils/seo.js'
import './App.css'

// Resuelve la ruta actual a una vista conocida. Todo lo que no matchea una
// ruta valida cae en 'notFound' (evita el soft-404 que servia la home en
// cualquier URL basura).
function resolveRoute(pathname) {
  const path = pathname.replace(/\/$/, '')
  if (path === '') return 'home'
  if (path === '/free-fire-prime-scanner') return 'scanner'
  if (/^\/cuenta\/\d+\.html$/.test(path)) return 'scanner'
  return 'notFound'
}

function App() {
  const route = resolveRoute(window.location.pathname)

  useEffect(() => {
    applySeo(
      route === 'scanner' ? SEO.primeScanner
        : route === 'notFound' ? SEO.notFound
          : SEO.home,
    )
  }, [route])

  if (route === 'scanner') return <FreeFirePrimeScanner />
  if (route === 'notFound') return <NotFound />

  return <HomePage />
}

export default App

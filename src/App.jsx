import { lazy, Suspense, useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import NotFound from './components/NotFound.jsx'
import DaniVexCompanion from './companion/DaniVexCompanion.jsx'
import { applySeo, SEO } from './utils/seo.js'
import AccountProvider from './account/AccountProvider.jsx'
import { useAccount } from './account/context.js'
import './App.css'

const PlayerScanner = lazy(() => import('./pages/PlayerScanner.jsx'))
const AccountPage = lazy(() => import('./account/AccountPage.jsx'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'))
const AssistantWidget = lazy(() => import('./account/AssistantWidget.jsx'))
// Admin-only bundle: lazy so it never ships in the public/critical path.
const AdminPage = lazy(() => import('./account/AdminPage.jsx'))

function OptionalAssistant() {
  const { assistant } = useAccount()
  return assistant ? <Suspense fallback={null}><AssistantWidget /></Suspense> : null
}

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
  if (path === '/privacy') return 'privacy'
  if (/^\/account(?:\/(favorites|saved|downloads|activity|assistant|support|settings))?$/.test(path)) return 'account'
  if (['/signin', '/register', '/reset-password', '/auth/confirm'].includes(path)) return 'account'
  if (/^\/admin(?:\/(users|platform|audit))?$/.test(path)) return 'admin'
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
      route === 'admin' ? { ...SEO.admin, path: window.location.pathname }
        : route === 'account' ? { ...SEO.account, path: window.location.pathname }
        : route === 'privacy' ? SEO.privacy
        : route === 'player' ? SEO.playerScanner
        : route === 'notFound' ? SEO.notFound
          : SEO.home,
    )
  }, [route])

  if (route === 'legacyScanner') return null
  if (route === 'notFound') return <NotFound />

  return (
    <AccountProvider>
      <Suspense fallback={<div className="page-loading" role="status">DaniVex</div>}>
        {route === 'admin' ? <AdminPage /> : route === 'account' ? <AccountPage /> : route === 'privacy' ? <PrivacyPage /> : route === 'player' ? <PlayerScanner /> : <HomePage />}
      </Suspense>
      {['home', 'player'].includes(route) && <DaniVexCompanion />}
      <OptionalAssistant />
    </AccountProvider>
  )
}

export default App

/*
  Fuente unica de verdad de los metadatos SEO por vista. Data pura, sin refs al
  navegador, para que la consuman TANTO el runtime (src/utils/seo.js, que actualiza
  el <head> en cliente) COMO el prerender de build (vite.config.js, que hornea el
  <head> correcto por ruta en HTML estatico para los scrapers sociales sin JS).
*/

export const SITE = 'https://danivex.com'
export const OG_IMAGE = `${SITE}/preview.png`

export const SEO = {
  privacy: { title: 'Privacidad | DaniVex', description: 'Cómo DaniVex trata los datos del sitio, las cuentas, el Player Scanner y el asistente.', path: '/privacy' },
  account: { title: 'Tu cuenta | DaniVex', description: 'Gestiona tus favoritos, configuraciones y preferencias de DaniVex.', path: '/account', noindex: true },
  admin: { title: 'Admin | DaniVex', description: 'Panel de administración de la plataforma DaniVex.', path: '/admin', noindex: true },
  home: {
    title: 'DaniVex - Sensibilidad Free Fire, Player Scanner y Mobilador',
    description:
      'Ajusta tu sensibilidad Free Fire, consulta jugadores por UID y conecta tu Android al PC con DaniVex Mobilador. Herramientas para gamers.',
    path: '/',
  },
  playerScanner: {
    title: 'Player Scanner - Busca jugadores de Free Fire por UID | DaniVex',
    description:
      'Busca cualquier jugador de Free Fire por UID y consulta su informacion publica: nickname, region, nivel, rangos, clan, outfit e historial de cambios. Gratis y sin registro.',
    path: '/player-scanner',
  },
  notFound: {
    title: 'Pagina no encontrada | DaniVex',
    description: 'La pagina que buscas no existe en DaniVex.',
    noindex: true,
  },
}

// Rutas que se prerenderizan a HTML estatico propio en build (excluye home, que
// ya es el index.html por defecto, y notFound, que no tiene URL fija).
export const PRERENDER_ROUTES = [
  { out: 'player-scanner.html', meta: SEO.playerScanner },
  { out: 'privacy.html', meta: SEO.privacy },
  { out: 'account.html', meta: SEO.account },
  { out: 'admin.html', meta: SEO.admin },
  { out: '404.html', meta: SEO.notFound },
]

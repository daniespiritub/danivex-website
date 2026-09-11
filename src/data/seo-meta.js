/*
  Fuente unica de verdad de los metadatos SEO por vista. Data pura, sin refs al
  navegador, para que la consuman TANTO el runtime (src/utils/seo.js, que actualiza
  el <head> en cliente) COMO el prerender de build (vite.config.js, que hornea el
  <head> correcto por ruta en HTML estatico para los scrapers sociales sin JS).
*/

export const SITE = 'https://danivex.com'
export const OG_IMAGE = `${SITE}/preview.png`

export const SEO = {
  home: {
    title: 'DaniVex - Generador de Sensibilidad Free Fire',
    description:
      'Elegi tu dispositivo y arma una base de sensibilidad lista para Free Fire, gratis y sin registro.',
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
]

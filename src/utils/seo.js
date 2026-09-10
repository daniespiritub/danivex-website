/*
  SEO por vista para la SPA. Al ser routing manual (sin react-router ni SSR),
  actualizamos las etiquetas <head> en runtime segun la ruta. Esto lo aprovechan
  los crawlers que ejecutan JS (Google) y fija el canonical correcto por vista.
  Nota: los scrapers sociales que NO ejecutan JS (WhatsApp/Twitter) siguen viendo
  el <head> estatico de index.html, por eso ese default es de marca (neutro).
*/

const SITE = 'https://danivex.com'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

// Aplica un set de metadatos de forma idempotente (title, description, canonical,
// Open Graph, Twitter y robots). Solo toca lo que recibe. `noindex` marca la
// vista como no indexable (ej: 404) y se revierte al navegar a una vista real.
export function applySeo({ title, description, path = '/', image, noindex = false }) {
  const url = SITE + path
  if (title) document.title = title
  setMeta('name', 'description', description)
  setCanonical(url)
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')

  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  if (image) setMeta('property', 'og:image', image)

  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  if (image) setMeta('name', 'twitter:image', image)
}

// Metadatos por vista. Centralizados para mantener consistencia.
export const SEO = {
  home: {
    title: 'DaniVex - Generador de Sensibilidad Free Fire',
    description:
      'Elegi tu dispositivo y arma una base de sensibilidad lista para Free Fire, gratis y sin registro.',
    path: '/',
  },
  primeScanner: {
    title: 'Free Fire Prime AI Scanner - Analiza tu cuenta por UID | DaniVex',
    description:
      'Consulta el perfil publico de cualquier cuenta de Free Fire por UID: nivel, region, gremio, antiguedad, cambios recientes y comparacion entre jugadores. Gratis y sin registro.',
    path: '/free-fire-prime-scanner',
  },
  notFound: {
    title: 'Pagina no encontrada | DaniVex',
    description: 'La pagina que buscas no existe en DaniVex.',
    noindex: true,
  },
}

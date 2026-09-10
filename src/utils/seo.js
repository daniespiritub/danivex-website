/*
  SEO por vista para la SPA. Actualiza las etiquetas <head> en runtime segun la
  ruta (para crawlers que ejecutan JS, como Google, y para fijar el canonical).
  Los datos por vista viven en src/data/seo-meta.js (fuente unica compartida con
  el prerender de build). Las rutas conocidas ya se sirven prerenderizadas con su
  <head> correcto (ver vite.config.js), asi que los scrapers sociales sin JS
  tambien ven los metadatos correctos.
*/

import { SITE, SEO } from '../data/seo-meta.js'

export { SEO }

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

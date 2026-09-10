import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PRERENDER_ROUTES, SITE } from './src/data/seo-meta.js'

// Escapa un valor para usarlo como texto/atributo HTML.
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Reemplaza (o deja igual) una etiqueta identificada por un atributo, sin
// importar el formato (una o varias lineas): [^>]* no cruza el cierre '>'.
function replaceTag(html, matcher, replacement) {
  return matcher.test(html) ? html.replace(matcher, replacement) : html
}

// Toma el index.html compilado (head de marca / home) y devuelve una variante
// con el <head> reescrito para `meta`. Conserva todo lo demas (assets, favicon,
// theme-color, scripts), asi la SPA sigue cargando e hidratando igual.
function withRouteMeta(html, meta) {
  const url = SITE + (meta.path || '/')
  const t = esc(meta.title)
  const d = esc(meta.description)
  return [
    [/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${t}</title>`],
    [/<meta[^>]*\bname=["']description["'][^>]*>/i, `<meta name="description" content="${d}">`],
    [/<link[^>]*\brel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${url}">`],
    [/<meta[^>]*\bproperty=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${t}">`],
    [/<meta[^>]*\bproperty=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${d}">`],
    [/<meta[^>]*\bproperty=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${url}">`],
    [/<meta[^>]*\bname=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${t}">`],
    [/<meta[^>]*\bname=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${d}">`],
  ].reduce((acc, [m, r]) => replaceTag(acc, m, r), html)
}

// Plugin: tras el build, genera un HTML estatico por cada ruta conocida con su
// <head> correcto. Da preview social por-ruta a scrapers que NO ejecutan JS.
function prerenderRoutes() {
  let outDir = 'dist'
  return {
    name: 'danivex-prerender-routes',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const indexHtml = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const route of PRERENDER_ROUTES) {
        const html = withRouteMeta(indexHtml, route.meta)
        writeFileSync(resolve(outDir, route.out), html)
        console.log(`[prerender] dist/${route.out} <- ${route.meta.title}`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderRoutes()],
})

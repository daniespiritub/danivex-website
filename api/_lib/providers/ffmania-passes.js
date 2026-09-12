/*
  Provider READ-ONLY de la coleccion de Pases (FreeFireMania).

  FreeFireMania renderiza en el HTML PUBLICO del perfil (server-rendered) el album
  de pases con el estado de POSESION de la cuenta. Este provider SOLO hace un GET
  publico y parsea ese album ya publicado. NO actualiza, NO dispara el flujo
  protegido por Turnstile, NO resuelve captcha.

  Estructura del album (perfil-pass-album): cada pase es
    <div class="perfil-pass-badge" title="#97">        -> POSEIDO
    <div class="perfil-pass-badge not-owned" title="#98"> -> NO poseido
      <img ... alt="P98" ...> <span>44</span>            -> valor asociado
  El pase actual (perfil-pass-badge is-pass, title="Temporada N") se ignora.

  Si el perfil aun NO tiene el album publicado, no hay dato => unavailable (no se
  inventa). El pase P-N mapea al id 1001000000+N (P1..P55 Elite, P56+ Booyah).
*/

import { getHtmlWithFetch } from '../http.js'

const PROFILE_URL = (uid) => `https://www.freefiremania.com.br/cuenta/${encodeURIComponent(uid)}.html`

// Parsea el album del HTML publico. Devuelve { owned:[N], notOwned:[N], values:{N:v} }
// o null si no hay album publicado.
export function parsePassAlbum(html) {
  if (!html || !html.includes('perfil-pass-album')) return null
  const parts = html.split('class="perfil-pass-badge').slice(1)
  const owned = []
  const notOwned = []
  const values = {}
  for (const raw of parts) {
    const chunk = raw.slice(0, 600)
    // Numero del pase: title="#N" (album) o alt="PN". Si no hay => no es un pase
    // numerado (p.ej. el pase actual "is-pass" con title="Temporada N") => saltar.
    const numMatch = chunk.match(/title="#(\d+)"/) || chunk.match(/alt="P(\d+)"/)
    if (!numMatch) continue
    const n = Number(numMatch[1])
    if (!Number.isFinite(n) || n <= 0) continue
    const isNotOwned = raw.startsWith(' not-owned')
    const valMatch = chunk.match(/<span>(\d+)<\/span>/)
    if (valMatch) values[n] = Number(valMatch[1])
    if (isNotOwned) notOwned.push(n)
    else owned.push(n)
  }
  if (owned.length === 0 && notOwned.length === 0) return null
  return { owned, notOwned, values }
}

// Parsea el RANGO CS del HTML publico (server-rendered, read-only). FFM muestra el
// tier REAL del juego (no derivado de estrellas) + estrellas + emblema oficial:
//   <span class="perfil-patente-mode">Clash Squad</span>
//   <img class="perfil-patente-img" src="...OB48/BR/CSPlatinum.png" alt="Platina V">
//   <span class="perfil-patente-name">Platina V</span> ... <em>58 estrellas</em>
// Devuelve { tier, division, stars, emblemUrl } o null. General para cualquier UID
// cuyo perfil este publicado. NO se deriva el tier de las estrellas (58★ = Platino,
// 55★ = Maestro: las estrellas NO determinan el tier por si solas).
export function parseCsRank(html) {
  if (!html) return null
  const i = html.indexOf('perfil-patente-mode">Clash Squad')
  if (i < 0) return null
  const block = html.slice(i, i + 700)
  const nameM = block.match(/perfil-patente-name">([^<]+)</) || block.match(/alt="([^"]+)"/)
  if (!nameM) return null
  const full = nameM[1].trim()
  if (!full) return null
  const starsM = block.match(/<em>\s*(\d+)\s*estrellas?/i)
  const emblemM = block.match(/perfil-patente-img"\s+src="([^"]+)"/)
  // Separa "Platina V" -> base "Platina" + division "V".
  const divM = full.match(/\s+([IVX]+)$/)
  const division = divM ? divM[1] : ''
  const base = division ? full.slice(0, full.length - division.length).trim() : full
  return { tier: base, full, division, stars: starsM ? starsM[1] : '', emblemUrl: emblemM ? emblemM[1] : '' }
}

// getFfmExtras(uid): UN GET publico -> { album (pases), cs (rango CS) }. Best-effort.
export async function getFfmExtras(uid) {
  const cleanUid = String(uid || '').replace(/[^\d]/g, '')
  if (!cleanUid) return { ok: false, outcome: 'no_uid' }
  try {
    const html = await getHtmlWithFetch(PROFILE_URL(cleanUid), Number(process.env.FFM_PASS_TIMEOUT_MS || 6000))
    const album = parsePassAlbum(html)
    const cs = parseCsRank(html)
    if (!album && !cs) return { ok: false, outcome: 'empty' }
    return { ok: true, album, cs }
  } catch (error) {
    return { ok: false, outcome: 'error', error: error.message }
  }
}

// Compat: getPasses solo el album (usado por tests existentes).
export async function getPasses(uid) {
  const r = await getFfmExtras(uid)
  return r.ok && r.album ? { ok: true, album: r.album } : { ok: false, outcome: r.outcome || 'empty' }
}

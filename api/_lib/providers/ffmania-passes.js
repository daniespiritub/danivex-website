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

// getPasses(uid): GET publico + parse. Best-effort: nunca lanza.
export async function getPasses(uid) {
  const cleanUid = String(uid || '').replace(/[^\d]/g, '')
  if (!cleanUid) return { ok: false, outcome: 'no_uid' }
  try {
    const html = await getHtmlWithFetch(PROFILE_URL(cleanUid), Number(process.env.FFM_PASS_TIMEOUT_MS || 6000))
    const album = parsePassAlbum(html)
    if (!album) return { ok: false, outcome: 'empty' }
    return { ok: true, album }
  } catch (error) {
    return { ok: false, outcome: 'error', error: error.message }
  }
}

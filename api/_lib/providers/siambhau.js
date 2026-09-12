/*
  Proveedor SiamBhau (Free Fire Centralized API — grupo "Free Fire Info").
  Implementa la interface PlayerDataProvider extendida: { name, label, needsRegion,
  isEnabled, getProfile(uid, opts) }.

  Devuelve datos RICOS (rangos BR/CS, prime, outfit, pet, titulo, badges) que la
  fuente keyless (FreeFireMania/Jornal) no ofrece. Se activa SOLO si esta la env
  SIAMBHAU_API_KEY (la key NUNCA va al frontend; toda consulta es server-side).

  Nota: el endpoint responde por HTTPS con certificado valido (verificado
  2026-09-11), asi que la key viaja cifrada. Se obtiene gratis via Telegram
  @SiamBhau. Ver docs/PLAYER_SCANNER.md.

  El mapeo sigue la forma estandar de AccountInfo de Free Fire, leyendo con
  tolerancia varios nombres de campo posibles. Nunca inventa: si un campo no
  viene, queda vacio.
*/

import { classifyFetchError } from '../log.js'
import { resolveBrRankFromPoints } from '../rank-rules.js'
import { csTierFromCode } from '../cs-rank-rules.js'
import { resolvePet } from '../pet-catalog.js'
import { normalizeStats } from '../stats-model.js'

export const name = 'siambhau'
export const label = 'SiamBhau'
export const needsRegion = true

// HTTPS con certificado valido verificado (ssl_verify=0) el 2026-09-11: la key
// viaja cifrada. Override con SIAMBHAU_BASE_URL si el host cambia.
const BASE_URL = process.env.SIAMBHAU_BASE_URL || 'https://siambhau69.eu.cc'
// CDN publico de iconos de items FF por ID (avatar/banner/outfit). jsdelivr:
// HTTPS, keyless, cross-origin, cacheado global. Verificado 2026-09-11 con IDs
// reales (218x218 png/webp). Overridable con FF_ITEM_ICON_BASE. Al ser keyless
// no expone ningun secreto: el frontend puede usar estas URLs directamente.
const ITEM_ICON_BASE = process.env.FF_ITEM_ICON_BASE || 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG'
const ICON_EXT = process.env.FF_ITEM_ICON_EXT || 'png'

export function isEnabled() {
  return Boolean(process.env.SIAMBHAU_API_KEY)
}

function iconUrl(id) {
  if (!id || !ITEM_ICON_BASE) return ''
  return `${ITEM_ICON_BASE.replace(/\/$/, '')}/${id}.${ICON_EXT}`
}

// Mapea los rangos BR/CS desde basicInfo. Conserva los codigos raw.
//
// VERIFICADO contra capturas del juego (UID 2196518104, 2026-09-11):
//  - BR: el juego muestra "Heroico" con rankingPoints=3539 y seasonId=53. El
//    tier se deriva del RP (oficial: Heroico = 3125+), NO del codigo basicInfo.rank
//    (=321), que NO es fiable para nombrar el tier. seasonId (53) = temporada BR.
//    => BR se muestra con tier(RP) + RP + temporada (verificado). Ver rank-rules.js.
//  - CS: el juego muestra 55 estrellas y temporada S38, pero la API devuelve
//    csRankingPoints=142 (!= 55), NO trae estrellas, NO trae temporada CS (seasonId
//    es solo de BR) y el codigo csRank no es fiable para el tier. => CS no tiene
//    rango/estrellas/temporada verificables en esta fuente: se dejan vacios y solo
//    se conserva el valor raw internamente (rankCSRawValue). NUNCA se inventan.
function mapRanks(basic) {
  const str = (v) => (v != null ? String(v) : '')
  const brPoints = str(basic.rankingPoints ?? basic.brRankPoint)
  // BR: el RP es la fuente de verdad. Resolver detallado -> tier + division + estrellas
  // + progreso al siguiente escalon (subdivisiones Heroico verificadas S53).
  const brHidden = basic.showBrRank === false
  const br = brHidden ? null : resolveBrRankFromPoints({ points: brPoints, season: str(basic.seasonId) })
  const csRaw = str(basic.csRankingPoints ?? basic.csRankPoint)
  // CS tier GENERAL desde el codigo autoritativo del juego (csRank). Live para
  // cualquier UID, anclado al ground truth (323=Maestro). Las ESTRELLAS del display
  // in-game NO las expone la API (csRankingPoints != estrellas) => rankCSStars vacio
  // salvo observacion verificada; nunca se inventan.
  const csHidden = basic.showCsRank === false
  const csTier = csHidden ? null : csTierFromCode(basic.csRank)
  return {
    // Battle Royale (RP) — tier + subdivision + estrellas + progreso, derivado del RP.
    rankBR: br ? br.tier : '',
    rankBRDivision: br ? br.division : '', // Heroico I/II, Heroico Elite III/IV/V (verificado S53)
    rankBRStarLevel: br && br.starLevel != null ? String(br.starLevel) : '',
    rankBRNextThreshold: br && br.nextThreshold != null ? String(br.nextThreshold) : '',
    rankBRPointsToNext: br && br.pointsToNext != null ? String(br.pointsToNext) : '',
    rankBRCode: str(basic.rank ?? basic.brRank), // codigo raw (referencia interna)
    rankBRPoints: brPoints,
    rankBRConfidence: brHidden ? 'hidden' : (br ? br.confidence : 'unavailable'),
    // Clash Squad — TIER desde el codigo del juego (general/live); estrellas/temporada
    // no las da esta fuente (se completan con observacion verificada si existe).
    rankCS: csTier ? csTier.tier : '',
    rankCSDivision: csTier ? csTier.division : '',
    rankCSCode: str(basic.csRank), // codigo raw (id de rango autoritativo)
    rankCSStars: '', // la API no da las estrellas reales del juego
    rankCSRawValue: csRaw, // valor interno csRankingPoints (!= estrellas; sin interpretar)
    rankCSPoints: '', // no exponer como puntos (seria falso)
    rankCSSource: csTier ? csTier.source : '',
    rankCSConfidence: csHidden ? 'hidden' : (csTier ? csTier.confidence : 'unavailable'),
    // seasonId es la temporada de BR; CS tiene su propia temporada que la API no expone.
    season: str(basic.seasonId),
  }
}

function epochToDate(value) {
  if (!value) return ''
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  const ms = n < 1e12 ? n * 1000 : n // segundos o milisegundos
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'medium' })
}

// Mapea el JSON de SiamBhau (forma AccountInfo estandar) a nuestro perfil crudo.
// Lee con tolerancia: distintos despliegues usan basicInfo/AccountInfo, etc.
export function mapSiamBhauProfile(data) {
  const d = data || {}
  const basic = d.basicInfo || d.AccountInfo || d.account || {}
  const profileInfo = d.profileInfo || d.AccountProfileInfo || d.profile || {}
  const clanInfo = d.clanBasicInfo || d.clan || d.guildInfo || {}
  const captain = d.captainBasicInfo || d.captain || {}
  const pet = d.petInfo || d.pet || {}
  const social = d.socialInfo || d.social || {}

  const prime = basic.primeInfo || d.primeInfo || {}
  const clothes = profileInfo.clothes || profileInfo.equippedOutfit || profileInfo.outfit || []
  // avatarId = avatar de perfil; headPic = icono de cabeza del personaje.
  const avatarId = profileInfo.avatarId || basic.avatarId || ''
  const headPic = basic.headPic || profileInfo.headPic || ''
  const bannerId = basic.bannerId || profileInfo.bannerId || ''

  return {
    nickname: basic.nickname || basic.username || '',
    region: basic.region || d.region || '',
    level: basic.level != null ? String(basic.level) : '',
    exp: basic.exp != null ? String(basic.exp) : '',
    likes: Number(basic.liked ?? basic.likes ?? 0),
    gameVersion: basic.releaseVersion || basic.gameVersion || '',
    creationDate: epochToDate(basic.createAt || basic.createTime || basic.accountCreateTime),
    lastLogin: epochToDate(basic.lastLoginAt || basic.lastLoginTime),

    // Rangos: BR se deriva del RP (fuente de verdad, ver rank-rules.js); CS no
    // tiene datos verificables en esta fuente. Se conservan los codigos raw.
    ...mapRanks(basic),

    // Prime (anidado en primeInfo.primeLevel):
    primeLevel: prime.primeLevel != null && prime.primeLevel !== 0 ? String(prime.primeLevel) : '',

    // Perfil visual: SiamBhau da IDs. El avatar/banner los resuelve profile-images
    // (prioriza la URL real de la fuente de perfil via el merge keyless; si no,
    // catalogo por headPic/bannerId). avatarId NO se usa para el avatar (es el
    // personaje base, no el avatar equipado). Aqui NO se fija avatar/banner.
    title: basic.title != null ? String(basic.title) : '',
    badgeCount: basic.badgeCnt != null ? String(basic.badgeCnt) : '',
    badgeId: basic.badgeId != null ? String(basic.badgeId) : '',
    avatarId: avatarId ? String(avatarId) : '',
    bannerId: bannerId ? String(bannerId) : '',
    headPic: headPic ? String(headPic) : '',

    // Outfit: lista de IDs (+ url si hay CDN configurado).
    outfit: (Array.isArray(clothes) ? clothes : []).map((id) => ({ id: String(id), image: iconUrl(id) })),

    // Pet: nombre de ESPECIE (petId -> catalogo), NUNCA el id numerico. `pet.name`
    // de la API es el APODO del jugador (se separa como petNickname). Skin (skinId)
    // -> nombre del aspecto. Imagen = skin equipada (coincide con el juego), fallback id.
    ...(() => {
      const r = resolvePet(pet)
      return {
        pet: r.name, // especie (o apodo no-numerico); '' si desconocido (nunca el id)
        petNickname: r.nickname, // apodo personalizado del jugador (si difiere)
        petSkinName: r.skinName, // nombre del aspecto equipado
        petNameSource: r.nameSource,
        petLevel: r.level,
        petId: r.id,
        petSkinId: r.skinId,
        petImage: iconUrl(pet.skinId || pet.id),
      }
    })(),

    // Bio / social:
    bio: social.signature || basic.signature || '',

    // Clan:
    clan: clanInfo.clanName || clanInfo.name || '',
    clanId: clanInfo.clanId != null ? String(clanInfo.clanId) : '',
    clanLevel: clanInfo.clanLevel != null ? String(clanInfo.clanLevel) : '',
    clanMembers: clanInfo.memberNum != null ? String(clanInfo.memberNum) : (clanInfo.members != null ? String(clanInfo.members) : ''),
    clanLeader: captain.nickname || clanInfo.captainName || '',
  }
}

export async function getProfile(uid, opts = {}) {
  if (!isEnabled()) return { ok: false, outcome: 'disabled' }

  const region = (opts.region || process.env.SIAMBHAU_DEFAULT_REGION || '').trim()
  if (!region) return { ok: false, outcome: 'no_region' }

  const key = process.env.SIAMBHAU_API_KEY
  const url = `${BASE_URL}/freefireinfo/bhau?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&key=${encodeURIComponent(key)}`
  const sourceUrl = `${BASE_URL}/freefireinfo/bhau?uid=${uid}&region=${region}` // sin key para logs/UI

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SIAMBHAU_TIMEOUT_MS || 7000))
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return { ok: false, outcome: res.status === 403 || res.status === 401 ? 'auth_error' : 'http_error', error: `HTTP ${res.status}`, sourceUrl }
    }
    const data = await res.json()
    if (data && (data.error || data.message === 'not found')) {
      return { ok: false, outcome: 'empty', sourceUrl }
    }
    const profile = mapSiamBhauProfile(data)
    if (!profile.nickname) return { ok: false, outcome: 'empty', sourceUrl }
    return { ok: true, profile, sourceUrl }
  } catch (error) {
    return { ok: false, outcome: classifyFetchError(error), error: error.message, sourceUrl }
  } finally {
    clearTimeout(timeout)
  }
}

// Fetch de un modo de stats (gamemode + matchmode). Devuelve el objeto `stats`
// crudo o null. Best-effort: nunca lanza (un fallo de stats no rompe el perfil).
async function fetchStatsMode(uid, region, key, gamemode, matchmode) {
  const url = `${BASE_URL}/freefireinfo/stats?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&gamemode=${gamemode}&matchmode=${matchmode}&key=${encodeURIComponent(key)}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SIAMBHAU_STATS_TIMEOUT_MS || 7000))
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.success && data.stats ? data.stats : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// getStats: estadisticas REALES de partidas (BR solo/duo/squad + CS), del endpoint
// /freefireinfo/stats de SiamBhau. Se piden BR CAREER + CS CAREER en PARALELO (2
// requests acotadas). Best-effort: si falla, devuelve { ok:false } y el perfil
// sigue funcionando sin stats. NO expone la key. Ver stats-model.js.
export async function getStats(uid, opts = {}) {
  if (!isEnabled()) return { ok: false, outcome: 'disabled' }
  const region = (opts.region || process.env.SIAMBHAU_DEFAULT_REGION || '').trim()
  if (!region) return { ok: false, outcome: 'no_region' }
  const key = process.env.SIAMBHAU_API_KEY

  // CARRERA (acumulado) + CLASIFICATORIA (ranked), BR y CS, en PARALELO (4 reqs
  // acotadas). Cada una best-effort: si un scope falla, el resto sigue.
  const [br, cs, rankedBr, rankedCs] = await Promise.all([
    fetchStatsMode(uid, region, key, 'br', 'CAREER'),
    fetchStatsMode(uid, region, key, 'cs', 'CAREER'),
    fetchStatsMode(uid, region, key, 'br', 'RANKED'),
    fetchStatsMode(uid, region, key, 'cs', 'RANKED'),
  ])
  const stats = normalizeStats({ br, cs, rankedBr, rankedCs })
  if (!stats) return { ok: false, outcome: 'empty' }
  return { ok: true, stats }
}

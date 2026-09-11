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

export const name = 'siambhau'
export const label = 'SiamBhau'
export const needsRegion = true

// HTTPS con certificado valido verificado (ssl_verify=0) el 2026-09-11: la key
// viaja cifrada. Override con SIAMBHAU_BASE_URL si el host cambia.
const BASE_URL = process.env.SIAMBHAU_BASE_URL || 'https://siambhau69.eu.cc'
// Base opcional de iconos de items (avatar/outfit) por ID. Sin ella, se guardan
// los IDs numericos sin URL de imagen (el front no muestra imagen rota).
const ITEM_ICON_BASE = process.env.FF_ITEM_ICON_BASE || ''

export function isEnabled() {
  return Boolean(process.env.SIAMBHAU_API_KEY)
}

// Nombre de tier a partir del codigo `rank` de Free Fire (enum de 3 digitos,
// ej. 321). Se deriva por rangos segun la escalera oficial de 8 tiers; el punto
// de ranking exacto SIEMPRE se muestra aparte, asi el label es orientativo y el
// dato duro (puntos) es la verdad. Confirmado con datos reales 2026-09-11
// (UID 2196518104: rank 321 = Gran Maestro con 3539 pts; csRank 323).
function rankTierName(value) {
  if (value === undefined || value === null || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return String(value)
  if (n < 200) return 'Bronce'
  if (n < 300) return 'Plata'
  if (n < 311) return 'Oro'
  if (n < 315) return 'Platino'
  if (n < 318) return 'Diamante'
  if (n < 320) return 'Heroico'
  if (n < 321) return 'Maestro'
  return 'Gran Maestro'
}

function iconUrl(id) {
  if (!id || !ITEM_ICON_BASE) return ''
  return `${ITEM_ICON_BASE.replace(/\/$/, '')}/${id}.png`
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

    // Rangos BR / CS (codigo de 3 digitos -> tier; puntos exactos aparte):
    rankBR: basic.showBrRank === false ? '' : rankTierName(basic.rank ?? basic.brRank ?? basic.maxRank),
    rankBRPoints: basic.rankingPoints != null ? String(basic.rankingPoints) : (basic.brRankPoint != null ? String(basic.brRankPoint) : ''),
    rankCS: basic.showCsRank === false ? '' : rankTierName(basic.csRank ?? basic.csMaxRank),
    rankCSPoints: basic.csRankingPoints != null ? String(basic.csRankingPoints) : (basic.csRankPoint != null ? String(basic.csRankPoint) : ''),
    season: basic.seasonId != null ? String(basic.seasonId) : '',

    // Prime (anidado en primeInfo.primeLevel):
    primeLevel: prime.primeLevel != null && prime.primeLevel !== 0 ? String(prime.primeLevel) : '',

    // Perfil visual (SiamBhau da IDs; el avatar/banner en URL lo completa el
    // merge keyless si no hay CDN configurado):
    title: basic.title != null ? String(basic.title) : '',
    badgeCount: basic.badgeCnt != null ? String(basic.badgeCnt) : '',
    avatarId: avatarId ? String(avatarId) : '',
    bannerId: bannerId ? String(bannerId) : '',
    headPic: headPic ? String(headPic) : '',
    avatar: iconUrl(avatarId),
    banner: iconUrl(bannerId),

    // Outfit: lista de IDs (+ url si hay CDN configurado).
    outfit: (Array.isArray(clothes) ? clothes : []).map((id) => ({ id: String(id), image: iconUrl(id) })),

    // Pet (con nombre real cuando viene):
    pet: pet.name || (pet.id != null ? String(pet.id) : ''),
    petLevel: pet.level != null ? String(pet.level) : '',

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

/*
  Proveedor SiamBhau (Free Fire Centralized API — grupo "Free Fire Info").
  Implementa la interface PlayerDataProvider extendida: { name, label, needsRegion,
  isEnabled, getProfile(uid, opts) }.

  Devuelve datos RICOS (rangos BR/CS, prime, outfit, pet, titulo, badges) que la
  fuente keyless (FreeFireMania/Jornal) no ofrece. Se activa SOLO si esta la env
  SIAMBHAU_API_KEY (la key NUNCA va al frontend; toda consulta es server-side).

  Nota: el endpoint publico de SiamBhau es HTTP (siambhau69.eu.cc). La key se
  obtiene gratis via Telegram @SiamBhau. Ver docs/PROVIDER_STATUS.md.

  El mapeo sigue la forma estandar de AccountInfo de Free Fire, leyendo con
  tolerancia varios nombres de campo posibles. Nunca inventa: si un campo no
  viene, queda vacio.
*/

import { classifyFetchError } from '../log.js'

export const name = 'siambhau'
export const label = 'SiamBhau'
export const needsRegion = true

const BASE_URL = process.env.SIAMBHAU_BASE_URL || 'http://siambhau69.eu.cc'
// Base opcional de iconos de items (avatar/outfit) por ID. Sin ella, se guardan
// los IDs numericos sin URL de imagen (el front no muestra imagen rota).
const ITEM_ICON_BASE = process.env.FF_ITEM_ICON_BASE || ''

export function isEnabled() {
  return Boolean(process.env.SIAMBHAU_API_KEY)
}

// Mapa estandar de tier de rango de Free Fire (id -> nombre). Si el id no esta
// en el mapa, se devuelve el valor crudo (nunca se inventa un nombre).
const RANK_TIERS = {
  1: 'Bronce I', 2: 'Bronce II', 3: 'Bronce III',
  4: 'Plata I', 5: 'Plata II', 6: 'Plata III',
  7: 'Oro I', 8: 'Oro II', 9: 'Oro III', 10: 'Oro IV',
  11: 'Platino I', 12: 'Platino II', 13: 'Platino III', 14: 'Platino IV',
  15: 'Diamante I', 16: 'Diamante II', 17: 'Diamante III', 18: 'Diamante IV',
  19: 'Heroico', 20: 'Gran Maestro',
}

function rankName(value) {
  if (value === undefined || value === null || value === '') return ''
  const n = Number(value)
  return RANK_TIERS[n] || String(value)
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

  const clothes = profileInfo.clothes || profileInfo.equippedOutfit || profileInfo.outfit || []
  const avatarId = profileInfo.avatarId || basic.headPic || profileInfo.headPic || ''
  const bannerId = profileInfo.bannerId || basic.bannerId || ''

  return {
    nickname: basic.nickname || basic.username || '',
    region: basic.region || d.region || '',
    level: basic.level != null ? String(basic.level) : '',
    exp: basic.exp != null ? String(basic.exp) : '',
    likes: Number(basic.liked ?? basic.likes ?? 0),
    gameVersion: basic.releaseVersion || basic.gameVersion || '',
    creationDate: epochToDate(basic.createAt || basic.createTime || basic.accountCreateTime),
    lastLogin: epochToDate(basic.lastLoginAt || basic.lastLoginTime),

    // Rangos BR / CS:
    rankBR: rankName(basic.rank ?? basic.brRank ?? basic.maxRank),
    rankBRPoints: basic.rankingPoints != null ? String(basic.rankingPoints) : (basic.brRankPoint != null ? String(basic.brRankPoint) : ''),
    rankCS: rankName(basic.csRank ?? basic.csMaxRank),
    rankCSPoints: basic.csRankingPoints != null ? String(basic.csRankingPoints) : (basic.csRankPoint != null ? String(basic.csRankPoint) : ''),
    season: basic.seasonId != null ? String(basic.seasonId) : '',

    // Prime:
    primeLevel: basic.primeLevel != null && basic.primeLevel !== 0 ? String(basic.primeLevel) : '',

    // Perfil visual:
    title: basic.title != null ? String(basic.title) : '',
    badgeCount: basic.badgeCnt != null ? String(basic.badgeCnt) : '',
    avatar: iconUrl(avatarId),
    banner: iconUrl(bannerId),

    // Outfit: lista de IDs (+ url si hay CDN configurado).
    outfit: (Array.isArray(clothes) ? clothes : []).map((id) => ({ id: String(id), image: iconUrl(id) })),

    // Pet:
    pet: pet.id != null ? String(pet.id) : '',
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

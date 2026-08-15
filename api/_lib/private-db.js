/*
  DaniVex Private UID Database - FIX 500

  Esta version evita import JSON con assertion para que Vercel local
  no crashee la serverless function.

  MODO 1:
  Si tienes KV/Upstash configurado, lee y guarda ahi.

  MODO 2:
  Si no tienes KV, usa seedCache en memoria como base inicial.
*/

import { nsKey } from './env-namespace.js'
import { normalizeStoredPlayer, stableProfileHash } from './player-model.js'
import { detectPlayerEvents } from './change-detection.js'
import { appendPlayerEvents } from './timeline.js'

// Re-export para compatibilidad con importadores existentes (tests).
export { stableProfileHash }

const KEY_PREFIX = 'danivex:ffuid:'

const seedCache = {
  '391832240': {
    uid: '391832240',
    nickname: 'MashメAlan',
    region: 'SAC',
    regionCode: 'SAC',
    regionCountry: 'SAC',
    creationDate: '13 de septiembre de 2018 às 21:35:27',
    lastLogin: '18 de mayo de 2026 às 19:24:35',
    accountAge: 'No disponible',
    level: '82',
    exp: '8.512.274',
    likes: 15872,
    gameVersion: 'OB53',
    pass: 'NV.52 (Não Pago)',
    clan: '-',
    clanId: '',
    clanLevel: '',
    clanMembers: '',
    bio: 'TIKTOK : MASH PRN!',
    skinStatus: 'Error al cargar skin',
    skinError: 'Error al cargar la informacion de la skin.',
    avatar: '',
    banner: '',
    diamonds: 0,
    primeLevel: '',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/391832240.html',
    provider: 'DaniVex Seed Cache',
    savedAt: '2026-05-19T00:00:00.000Z',
    updatedAt: '2026-05-19T00:00:00.000Z',
  },
  '3430570705': {
    uid: '3430570705',
    nickname: '+56 fortuna',
    region: 'SAC',
    regionCode: 'SAC',
    regionCountry: 'SAC',
    creationDate: '30 de junio de 2021 às 20:29:16',
    lastLogin: '18 de mayo de 2026 às 21:11:49',
    accountAge: 'No disponible',
    level: '78',
    exp: '3.776.430',
    likes: 12775,
    gameVersion: 'OB53',
    pass: 'NV.04 (Não Pago)',
    clan: '6.SENFASIS',
    clanId: '2064548150',
    clanLevel: '6',
    clanMembers: '17',
    bio: 'xile stgo 19',
    skinStatus: 'Mostrar skin del jugador',
    skinError: '',
    avatar: '',
    banner: '',
    diamonds: 0,
    primeLevel: '',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/3430570705.html',
    provider: 'DaniVex Seed Cache',
    savedAt: '2026-05-19T00:00:00.000Z',
    updatedAt: '2026-05-19T00:00:00.000Z',
  },
}

// Devuelve SOLO el registro persistido en KV (con lastObservedAt, contentHash,
// observedCount) o null. A diferencia de getCachedProfile, no cae al seedCache:
// el read-through necesita distinguir una observacion real almacenada de un
// seed hardcodeado sin frescura.
export async function getStoredProfile(uid) {
  return getFromKv(normalizeUid(uid))
}

export async function getCachedProfile(uid) {
  const cleanUid = normalizeUid(uid)

  const kvProfile = await getFromKv(cleanUid)
  if (kvProfile) {
    return {
      ...kvProfile,
      cacheHit: true,
      cacheSource: 'DaniVex Private DB',
    }
  }

  const seedProfile = seedCache[cleanUid]
  if (seedProfile) {
    return {
      ...seedProfile,
      uid: cleanUid,
      cacheHit: true,
      cacheSource: 'DaniVex Seed Cache',
    }
  }

  return null
}

export async function saveCachedProfile(uid, profile) {
  const cleanUid = normalizeUid(uid)

  if (!cleanUid || !profile?.nickname) {
    return {
      saved: false,
      reason: 'missing_uid_or_nickname',
    }
  }

  const now = new Date().toISOString()

  const normalized = normalizeStoredPlayer(cleanUid, profile)

  const contentHash = stableProfileHash(normalized)
  const existing = await getFromKv(cleanUid)

  // Dedup: si el contenido significativo no cambio, NO se reescribe un snapshot
  // nuevo; solo se actualiza lastObservedAt + observedCount.
  if (existing && existing.contentHash === contentHash) {
    const touched = {
      ...existing,
      lastObservedAt: now,
      observedCount: (Number(existing.observedCount) || 1) + 1,
    }
    const dedupResult = await saveToKv(cleanUid, touched)
    return dedupResult.ok
      ? { saved: true, dedup: true, observedCount: touched.observedCount, storage: 'kv' }
      : { saved: false, reason: dedupResult.reason || 'kv_not_configured' }
  }

  const record = {
    ...normalized,
    contentHash,
    firstObservedAt: existing?.firstObservedAt || now,
    lastObservedAt: now,
    observedCount: (Number(existing?.observedCount) || 0) + 1,
    savedAt: existing?.savedAt || profile.savedAt || now,
    updatedAt: now,
  }

  const result = await saveToKv(cleanUid, record)

  // Historical Intelligence: si actualizamos un perfil EXISTENTE con contenido
  // distinto, detectamos que cambio y lo registramos en el timeline
  // (best-effort). En la primera observacion no hay con que comparar.
  let events = []
  if (result.ok && existing) {
    events = detectPlayerEvents(existing, normalized)
    if (events.length) await appendPlayerEvents(cleanUid, events, now)
  }

  return result.ok
    ? { saved: true, dedup: false, changed: Boolean(existing), observedCount: record.observedCount, events, storage: 'kv' }
    : { saved: false, reason: result.reason || 'kv_not_configured' }
}

async function getFromKv(uid) {
  const config = getKvConfig()
  if (!config) return null

  try {
    const response = await fetch(`${config.url}/get/${encodeURIComponent(nsKey(KEY_PREFIX + uid))}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data?.result) return null

    return typeof data.result === 'string'
      ? JSON.parse(data.result)
      : data.result
  } catch {
    return null
  }
}

async function saveToKv(uid, profile) {
  const config = getKvConfig()

  if (!config) {
    return {
      ok: false,
      reason: 'kv_not_configured',
    }
  }

  try {
    const value = JSON.stringify(profile)
    const response = await fetch(`${config.url}/set/${encodeURIComponent(nsKey(KEY_PREFIX + uid))}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      body: value,
    })

    return {
      ok: response.ok,
      reason: response.ok ? '' : `kv_http_${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      reason: error.message,
    }
  }
}

function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  return { url, token }
}

function normalizeUid(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 14)
}

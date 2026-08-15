import { enforceIpRateLimit, enforceUidRateLimit, getClientIp } from './_lib/rate-limit.js'
import { logEvent } from './_lib/log.js'
import { getStoredProfile, saveCachedProfile } from './_lib/private-db.js'
import { classifyFreshness } from './_lib/cache-policy.js'
import { resolveProfile } from './_lib/read-through.js'
import { envNamespace } from './_lib/env-namespace.js'
import { buildResponse } from './_lib/normalize.js'
import { fetchProfileFromProviders } from './_lib/providers/index.js'

// Persistencia best-effort. NUNCA lanza: un fallo de DB no debe romper una
// busqueda que ya tuvo exito (provider success + DB failure = el usuario
// igual recibe su resultado). El save se hace con await para garantizar la
// escritura, envuelto para tragar cualquier error.
async function persistProfile(uid, response) {
  try {
    const result = await saveCachedProfile(uid, response)
    logEvent('ff_uid_persist', {
      uid,
      saved: result.saved,
      dedup: Boolean(result.dedup),
      changed: Boolean(result.changed),
      observedCount: result.observedCount || 0,
      reason: result.reason || '',
    })
    for (const change of result.events || []) {
      logEvent('ff_uid_change', { uid, type: change.type, field: change.field })
    }
  } catch (error) {
    logEvent('ff_uid_persist', { uid, saved: false, reason: 'exception', error: error.message })
  }
}

const SEED_CACHE = {
  '391832240': {
    uid: '391832240',
    nickname: 'MashメAlan',
    region: 'SAC',
    creationDate: '13 de septiembre de 2018 às 21:35:27',
    lastLogin: '18 de mayo de 2026 às 19:24:35',
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
    provider: 'DaniVex Fast Cache',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/391832240.html',
  },
  '3430570705': {
    uid: '3430570705',
    nickname: '+56 fortuna',
    region: 'SAC',
    creationDate: '30 de junio de 2021 às 20:29:16',
    lastLogin: '18 de mayo de 2026 às 21:11:49',
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
    provider: 'DaniVex Fast Cache',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/3430570705.html',
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const uid = String(req.query.uid || '').replace(/[^\d]/g, '').slice(0, 14)

  if (!uid) {
    return res.status(400).json({
      ok: false,
      error: 'UID requerido',
    })
  }

  // Rate limit por IP: protege el endpoint, aplica a TODA request (incluidos
  // cache hits). El limite por UID se consume mas abajo, SOLO si de verdad se va
  // a refrescar contra un proveedor (un fresh cache hit no gasta ese presupuesto).
  const ipRl = await enforceIpRateLimit({ ip: getClientIp(req), endpoint: 'free-fire-uid' })
  if (ipRl.blocked) {
    logEvent('ff_uid_ratelimited', { uid, scope: 'ip', retryAfter: ipRl.retryAfter || 60 })
    res.setHeader('Retry-After', String(ipRl.retryAfter || 60))
    return res.status(429).json({
      ok: false, uid, error: 'rate_limited', scope: 'ip', retryAfter: ipRl.retryAfter || 60,
      message: 'Demasiadas consultas seguidas. Espera unos segundos e intenta de nuevo.',
    })
  }

  // Seed cache hardcodeado (2 UIDs): respuesta instantanea, sin proveedor.
  const seed = SEED_CACHE[uid]
  if (seed) {
    logEvent('ff_uid_lookup', { uid, outcome: 'success', servedFrom: 'seed_cache', fallback: false })
    return res.status(200).json(withCache(buildResponse(uid, seed, true), { hit: true, state: 'fresh' }))
  }

  const testOpts = readTestOverrides(req)

  const stored = await getStoredProfile(uid)
  const freshness = classifyFreshness(stored?.lastObservedAt, Date.now(), testOpts.freshness)
  logEvent('ff_uid_cache', { uid, state: stored ? freshness : 'miss' })

  let uidBlocked = null
  const refresh = async () => {
    const uidRl = await enforceUidRateLimit({ uid })
    if (uidRl.blocked) {
      uidBlocked = uidRl
      return { ok: false, reason: 'rate_limited' }
    }
    return fetchFromProviders(uid, testOpts.forceProviderFail)
  }

  const result = await resolveProfile({
    stored,
    freshness,
    refresh,
    persist: (response) => persistProfile(uid, response),
  })

  if (result.servedFrom === 'cache_fresh') {
    logEvent('ff_uid_lookup', { uid, outcome: 'success', servedFrom: 'cache_fresh', fallback: false })
    return res.status(200).json(withCache(buildResponse(uid, stored, true), { hit: true, state: 'fresh' }))
  }

  if (result.servedFrom === 'provider') {
    logEvent('ff_uid_lookup', { uid, outcome: 'success', servedFrom: 'provider', provider: result.provider, fallback: Boolean(result.fallback) })
    return res.status(200).json(withCache(result.profile, { hit: false, state: 'fresh' }))
  }

  if (result.servedFrom === 'cache_stale') {
    logEvent('ff_uid_stale_fallback', { uid, lastObservedAt: stored.lastObservedAt })
    logEvent('ff_uid_lookup', { uid, outcome: 'success', servedFrom: 'cache_stale', fallback: true })
    return res.status(200).json(withCache(buildResponse(uid, stored, true), {
      hit: true, state: 'stale', fallback: true, lastObservedAt: stored.lastObservedAt, source: stored.provider || '',
    }))
  }

  // servedFrom === 'none': no se pudo servir. Distingue rate-limit de fallo real.
  if (uidBlocked) {
    logEvent('ff_uid_ratelimited', { uid, scope: 'uid', retryAfter: uidBlocked.retryAfter || 60 })
    res.setHeader('Retry-After', String(uidBlocked.retryAfter || 60))
    return res.status(429).json({
      ok: false, uid, error: 'rate_limited', scope: 'uid', retryAfter: uidBlocked.retryAfter || 60,
      message: 'Demasiadas consultas seguidas. Espera unos segundos e intenta de nuevo.',
    })
  }

  logEvent('ff_uid_lookup', { uid, outcome: result.refreshReason === 'not_found' ? 'not_found' : 'error', servedFrom: 'none', fallback: true })
  return res.status(200).json({
    ok: false,
    uid,
    provider: 'FreeFireJornal Perfil',
    message: result.refreshReason === 'not_found'
      ? 'No se encontro perfil publico para este UID.'
      : 'La consulta rapida no respondio. Intenta de nuevo.',
  })
}

// Consulta los proveedores (Mania -> Jornal). Devuelve la respuesta ya
// normalizada por buildResponse, o { ok:false, reason }. Emite ff_uid_provider.
async function fetchFromProviders(uid, forceFail) {
  if (forceFail) {
    logEvent('ff_uid_provider', { uid, provider: 'test', outcome: 'forced_fail' })
    return { ok: false, reason: 'provider_error' }
  }

  return fetchProfileFromProviders(uid, { logEvent })
}

// Adjunta metadata de cache aditiva sin tocar campos existentes.
function withCache(response, cache) {
  return { ...response, cache }
}

// Overrides de test, activos SOLO fuera de produccion (para ejercitar
// stale/expired/fallo de proveedor en preview sin manipular datos reales).
function readTestOverrides(req) {
  if (envNamespace() === 'prod') return { freshness: {}, forceProviderFail: false }
  const q = req.query || {}
  const freshness = {}
  if (q.__test_fresh_ttl_ms != null) freshness.freshTtlMs = Number(q.__test_fresh_ttl_ms)
  if (q.__test_stale_max_ms != null) freshness.staleMaxAgeMs = Number(q.__test_stale_max_ms)
  return { freshness, forceProviderFail: q.__test_force_provider_fail === '1' }
}


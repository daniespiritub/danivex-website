/*
  Rate limiting DaniVex — ventana fija sobre el Redis/Upstash ya existente.

  Principio de seguridad: FAIL-OPEN. Si Redis no esta configurado o falla,
  la request se PERMITE. El rate limiting nunca debe romper una consulta que
  hoy funcionaria (mismo criterio best-effort que la persistencia futura).

  Limites (documentados en docs/RATE_LIMITING.md):
    - IP x endpoint: 30 req / 60 s
    - UID (global, cualquier IP): 10 req / 60 s
*/

import { Redis } from '@upstash/redis'

let cachedRedis
let redisResolved = false

function getRedis() {
  if (redisResolved) return cachedRedis
  redisResolved = true

  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  cachedRedis = url && token ? new Redis({ url, token }) : null
  return cachedRedis
}

export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  return (
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

// Un incremento en una ventana fija. Devuelve si esta permitido. Fail-open.
async function hitWindow(key, limit, windowSec) {
  const redis = getRedis()
  if (!redis) return { allowed: true, remaining: limit, degraded: true }

  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)

    if (count <= limit) {
      return { allowed: true, remaining: Math.max(0, limit - count) }
    }

    const ttl = await redis.ttl(key)
    return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : windowSec }
  } catch {
    // Redis caido / error de red: permitir (fail-open).
    return { allowed: true, remaining: limit, degraded: true }
  }
}

const IP_LIMIT = { limit: 30, windowSec: 60 }
const UID_LIMIT = { limit: 10, windowSec: 60 }

/*
  Comprueba IP x endpoint y, si hay uid, tambien el UID global.
  Devuelve el primer bloqueo encontrado, o { blocked: false }.
*/
export async function enforceRateLimit({ ip, endpoint, uid }) {
  const ipResult = await hitWindow(`rl:ip:${ip}:${endpoint}`, IP_LIMIT.limit, IP_LIMIT.windowSec)
  if (!ipResult.allowed) {
    return { blocked: true, scope: 'ip', retryAfter: ipResult.retryAfter, limit: IP_LIMIT.limit }
  }

  if (uid) {
    const uidResult = await hitWindow(`rl:uid:${uid}`, UID_LIMIT.limit, UID_LIMIT.windowSec)
    if (!uidResult.allowed) {
      return { blocked: true, scope: 'uid', retryAfter: uidResult.retryAfter, limit: UID_LIMIT.limit }
    }
  }

  return { blocked: false }
}

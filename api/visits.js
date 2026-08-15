import { Redis } from '@upstash/redis'
import { enforceRateLimit, getClientIp } from './_lib/rate-limit.js'
import { envNamespace, nsKey } from './_lib/env-namespace.js'

const LEGACY_COUNTER_KEY = 'danivex:visits'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

// Migracion perezosa una sola vez: al introducir namespaces, prod:danivex:visits
// no existe y el contador arrancaria en 0. Se siembra desde la clave legacy sin
// prefijo (aditiva, idempotente, SOLO en prod). No borra la legacy: el rollback
// de la app vuelve a leerla sin ninguna accion manual sobre Redis.
async function seedLegacyVisitsOnce(counterKey) {
  if (envNamespace() !== 'prod') return
  try {
    const exists = await redis.exists(counterKey)
    if (exists) return
    const legacy = await redis.get(LEGACY_COUNTER_KEY)
    if (legacy !== null && legacy !== undefined) {
      await redis.set(counterKey, legacy, { nx: true })
    }
  } catch {
    // best-effort: si falla, el contador simplemente arranca en 0.
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const rl = await enforceRateLimit({ ip: getClientIp(req), endpoint: 'visits' })
  if (rl.blocked) {
    res.setHeader('Retry-After', String(rl.retryAfter || 60))
    return res.status(429).json({ ok: false, error: 'rate_limited', retryAfter: rl.retryAfter || 60 })
  }

  const counterKey = nsKey('danivex:visits')

  try {
    await seedLegacyVisitsOnce(counterKey)

    const count = req.method === 'POST'
      ? await redis.incr(counterKey)
      : Number(await redis.get(counterKey)) || 0

    return res.status(200).json({ ok: true, count })
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'visits_unavailable', message: error.message })
  }
}

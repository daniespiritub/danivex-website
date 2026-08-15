import { Redis } from '@upstash/redis'
import { enforceRateLimit, getClientIp } from './_lib/rate-limit.js'

const COUNTER_KEY = 'danivex:visits'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

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

  try {
    const count = req.method === 'POST'
      ? await redis.incr(COUNTER_KEY)
      : Number(await redis.get(COUNTER_KEY)) || 0

    return res.status(200).json({ ok: true, count })
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'visits_unavailable', message: error.message })
  }
}

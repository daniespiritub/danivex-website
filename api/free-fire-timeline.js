/*
  Endpoint de timeline (Player Profiles / Historical Intelligence).
  Solo lectura: devuelve los eventos de cambio detectados para un UID.
  Additivo: no altera /api/free-fire-uid. Rate limit por IP (no llama a
  proveedores externos). Namespaced por entorno via getPlayerTimeline.
*/

import { enforceIpRateLimit, getClientIp } from './_lib/rate-limit.js'
import { getPlayerTimeline } from './_lib/timeline.js'
import { logEvent } from './_lib/log.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const uid = String(req.query.uid || '').replace(/[^\d]/g, '').slice(0, 14)
  if (!uid) {
    return res.status(400).json({ ok: false, error: 'UID requerido' })
  }

  const ipRl = await enforceIpRateLimit({ ip: getClientIp(req), endpoint: 'free-fire-timeline' })
  if (ipRl.blocked) {
    res.setHeader('Retry-After', String(ipRl.retryAfter || 60))
    return res.status(429).json({ ok: false, uid, error: 'rate_limited', retryAfter: ipRl.retryAfter || 60 })
  }

  const events = await getPlayerTimeline(uid)
  logEvent('ff_timeline', { uid, count: events.length })

  return res.status(200).json({ ok: true, uid, count: events.length, events })
}

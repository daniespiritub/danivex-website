/*
  Timeline de eventos por jugador (Historical Intelligence, Fase 4).
  Lista Redis capada, namespaced por entorno, best-effort/fail-safe: un fallo
  de KV nunca rompe la consulta principal.
*/

import { Redis } from '@upstash/redis'
import { nsKey } from './env-namespace.js'

const MAX_EVENTS = 50

let cachedRedis
let resolved = false

function getRedis() {
  if (resolved) return cachedRedis
  resolved = true
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  cachedRedis = url && token ? new Redis({ url, token }) : null
  return cachedRedis
}

function timelineKey(uid) {
  return nsKey(`danivex:ffevents:${uid}`)
}

// Agrega eventos al principio de la lista y capa a MAX_EVENTS. Best-effort.
export async function appendPlayerEvents(uid, events, at) {
  const redis = getRedis()
  if (!redis || !events?.length) return { saved: false }

  try {
    const key = timelineKey(uid)
    const entries = events.map((e) => JSON.stringify({ ...e, at }))
    await redis.lpush(key, ...entries)
    await redis.ltrim(key, 0, MAX_EVENTS - 1)
    return { saved: true, count: events.length }
  } catch {
    return { saved: false }
  }
}

// Lee los eventos mas recientes (mas nuevo primero). Best-effort => [].
export async function getPlayerTimeline(uid, limit = MAX_EVENTS) {
  const redis = getRedis()
  if (!redis) return []

  try {
    const raw = await redis.lrange(timelineKey(uid), 0, limit - 1)
    return (raw || [])
      .map((x) => {
        if (x && typeof x === 'object') return x
        try {
          return JSON.parse(x)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

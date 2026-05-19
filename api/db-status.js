import { getCachedProfile } from './_lib/private-db.js'

export default async function handler(request, response) {
  const uid = String(request.query.uid || '').replace(/[^\d]/g, '').slice(0, 14)
  const kvConfigured = Boolean(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  )

  const cached = uid ? await getCachedProfile(uid) : null

  response.status(200).json({
    ok: true,
    privateDb: 'DaniVex',
    kvConfigured,
    uid: uid || null,
    cached: Boolean(cached),
    provider: cached?.provider || cached?.cacheSource || null,
  })
}

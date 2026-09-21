import { fetchProfileImage } from './_lib/profile-image-fetch.js'
import { PROFILE_IMAGE_NAME } from '../src/utils/scannerImages.js'
import { enforceIpRateLimit, getClientIp } from './_lib/rate-limit.js'

export function createProfileImageHandler({ download = fetchProfileImage, limit = enforceIpRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD')
      return res.status(405).end()
    }
    const query = new URL(req.url, 'https://danivex.com').searchParams
    const name = query.get('asset')
    if (query.size !== 1 || !name || !PROFILE_IMAGE_NAME.test(name)) return res.status(400).end()
    const rate = await limit({ ip: getClientIp(req), endpoint: 'profile-image' })
    if (rate.blocked) {
      res.setHeader('Retry-After', String(rate.retryAfter || 60))
      return res.status(429).end()
    }
    try {
      const body = await download(name)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
      res.setHeader('Content-Length', String(body.length))
      return res.status(200).end(req.method === 'HEAD' ? undefined : body)
    } catch {
      return res.status(502).end()
    }
  }
}

export default createProfileImageHandler()

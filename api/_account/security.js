import { createHmac, randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'

export class PublicError extends Error {
  constructor(code, status = 400) { super(code); this.status = status }
}
export function origin() {
  const value = process.env.APP_ORIGIN || 'https://danivex.com'
  const url = new URL(value)
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new PublicError('configuration_unavailable', 503)
  return url.origin
}
export function mutation(req) {
  if (req.method !== 'POST') throw new PublicError('method_not_allowed', 405)
  if (req.headers.origin !== origin()) throw new PublicError('origin_rejected', 403)
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new PublicError('json_required', 415)
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new PublicError('origin_rejected', 403)
}
export function body(req) {
  if (Number(req.headers['content-length']) > 16000) throw new PublicError('request_too_large', 413)
  let data
  try { data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch { throw new PublicError('invalid_json') }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new PublicError('invalid_json')
  if (Buffer.byteLength(JSON.stringify(data)) > 16000) throw new PublicError('request_too_large', 413)
  return data
}
export function text(value, min, max) {
  if (typeof value !== 'string' || value.length < min || value.length > max || value.includes('\u0000')) throw new PublicError('invalid_input')
  return value
}
export function headers(res) {
  res.setHeader('X-Request-ID', randomUUID())
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vary', 'Cookie, Origin')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
}
export function fail(res, error) {
  // Never serialize provider/SQL exception messages, tokens or request bodies.
  const known = error instanceof PublicError
  if (!known || error.status >= 500) console.error(JSON.stringify({ event: 'account_error', requestId: res.getHeader('X-Request-ID'), code: known ? error.message : 'service_unavailable' }))
  return res.status(known ? error.status : 503).json({ ok: false, error: known ? error.message : 'service_unavailable' })
}
export function limiterConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN && process.env.RATE_LIMIT_SECRET?.length >= 32)
}
export async function limit(req, bucket, max = 20, seconds = 60) {
  if (!limiterConfigured()) throw new PublicError('service_unavailable', 503)
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const hash = createHmac('sha256', process.env.RATE_LIMIT_SECRET).update(ip).digest('hex')
  const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN, retry: false, signal: () => AbortSignal.timeout(3000) })
  const key = `${process.env.VERCEL_ENV || 'development'}:account:rate:${bucket}:${hash}`
  const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n"
  let count
  try { count = await redis.eval(script, [key], [seconds]) } catch { throw new PublicError('service_unavailable', 503) }
  if (Number(count) > max) throw new PublicError('rate_limited', 429)
}
export function cookies(req) {
  const result = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    try { result[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1)) } catch { /* Malformed cookies are unauthenticated. */ }
  }
  return result
}
export function cookieName(name) { return `${origin().startsWith('https:') ? '__Host-' : ''}dv-${name}` }
export function setCookie(res, name, value, age = 2592000) {
  const flags = `; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${origin().startsWith('https:') ? '; Secure' : ''}`
  const previous = res.getHeader('Set-Cookie') || []
  res.setHeader('Set-Cookie', [...(Array.isArray(previous) ? previous : [previous]), `${cookieName(name)}=${encodeURIComponent(value)}${flags}`])
}
export function requireRecent(token) {
  // Called ONLY after Supabase getUser has validated this exact bearer token.
  let claims
  try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) } catch { throw new PublicError('reauthentication_required', 403) }
  const methods = claims.amr || []
  const recent = methods.some((x) => ['password', 'oauth', 'totp'].includes(x.method) && x.timestamp > Date.now() / 1000 - 300)
  if (!recent) throw new PublicError('reauthentication_required', 403)
}

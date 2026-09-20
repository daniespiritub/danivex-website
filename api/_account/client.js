import { createClient } from '@supabase/supabase-js'
import { cookies, cookieName, setCookie, limiterConfigured, PublicError } from './security.js'

export function enabled() {
  return process.env.ACCOUNT_ENABLED === 'true' && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) && limiterConfigured()
}
export function capabilities() {
  const account = enabled()
  return { account, google: account && process.env.AUTH_GOOGLE_ENABLED === 'true', apple: account && process.env.AUTH_APPLE_ENABLED === 'true', linking: account && process.env.AUTH_LINKING_ENABLED === 'true', deletion: account && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), assistant: process.env.ASSISTANT_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) && limiterConfigured() }
}
export function client(req, res) {
  if (!enabled()) throw new PublicError('account_unavailable', 503)
  const jar = cookies(req)
  const memory = new Map()
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) },
    auth: {
      autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, flowType: 'pkce', storageKey: 'dv-auth',
      experimental: { appendPkceFlowIdToRedirects: true },
      storage: {
        getItem: (key) => key.endsWith('code-verifier') ? jar[cookieName(key)] || null : memory.get(key) || null,
        setItem: (key, value) => { if (key.endsWith('code-verifier')) { jar[cookieName(key)] = value; setCookie(res, key, value, 600) } else memory.set(key, value) },
        removeItem: (key) => { if (key.endsWith('code-verifier')) { delete jar[cookieName(key)]; setCookie(res, key, '', 0) } else memory.delete(key) },
      },
    },
  })
}
export function saveSession(res, session) {
  if (!session?.access_token || !session?.refresh_token) throw new PublicError('authentication_failed', 401)
  setCookie(res, 'access', session.access_token)
  setCookie(res, 'refresh', session.refresh_token)
}
export function clearSession(res) {
  for (const name of ['access', 'refresh', 'pkce']) setCookie(res, name, '', 0)
}
export async function authenticated(req, res) {
  const db = client(req, res)
  const jar = cookies(req)
  const access = jar[cookieName('access')]
  const refresh = jar[cookieName('refresh')]
  if (!access || !refresh) throw new PublicError('authentication_required', 401)
  const { data, error } = await db.auth.setSession({ access_token: access, refresh_token: refresh })
  if (error || !data.session) { clearSession(res); throw new PublicError('authentication_required', 401) }
  const token = data.session.access_token
  const { data: checked, error: userError } = await db.auth.getUser(token)
  if (userError || !checked.user?.email_confirmed_at) throw new PublicError('authentication_required', 401)
  if (token !== access) saveSession(res, data.session)
  return { db, user: checked.user, token }
}
export function check(result) {
  if (result.error) {
    if (result.error.code === '23505') throw new PublicError('already_exists', 409)
    throw new PublicError('operation_failed', 400)
  }
  return result.data
}

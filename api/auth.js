import { createClient } from '@supabase/supabase-js'
import { authenticated, capabilities, client, saveSession, clearSession, check } from './_account/client.js'
import { headers, mutation, body, origin, limit, fail, text, requireRecent, PublicError, cookies, cookieName } from './_account/security.js'

export default async function handler(req, res) {
  headers(res)
  try {
    const action = new URL(req.url, origin()).searchParams.get('action') || 'session'
    if (req.method === 'GET' && action === 'config') return res.status(200).json({ ok: true, ...capabilities() })
    if (req.method === 'GET' && action === 'session') {
      if (!capabilities().account) return res.status(200).json({ ok: true, user: null, ...capabilities() })
      if (!cookies(req)[cookieName('access')]) return res.status(200).json({ ok: true, user: null, ...capabilities() })
      const { db, user } = await authenticated(req, res)
      const profile = check(await db.from('dv_profiles').select('handle,language,chat_history_enabled,created_at').eq('user_id', user.id).single())
      return res.status(200).json({ ok: true, user: { email: user.email, providers: (user.identities || []).map((i) => i.provider), ...profile }, ...capabilities() })
    }
    if (req.method === 'GET' && action === 'callback') {
      const url = new URL(req.url, origin())
      const code = text(url.searchParams.get('code'), 8, 2000)
      const auth = client(req, res)
      const flowId = url.searchParams.get('sb_flow_id')
      const result = await auth.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
      if (result.error) throw new PublicError('authentication_failed', 401)
      saveSession(res, result.data.session)
      res.setHeader('Location', '/account')
      return res.status(303).end()
    }
    mutation(req)
    if (!['signin', 'signup', 'reset', 'confirm', 'oauth', 'link', 'signout', 'password', 'email', 'delete'].includes(action)) throw new PublicError('unknown_action', 404)
    if (action === 'signout') {
      try {
        const { db } = await authenticated(req, res)
        const result = await db.auth.signOut({ scope: 'local' })
        if (result.error) throw new PublicError('account_unavailable', 503)
      } catch (error) {
        if (!(error instanceof PublicError && error.status === 401)) throw error
      } finally { clearSession(res) }
      return res.status(200).json({ ok: true })
    }
    await limit(req, `auth-${action}`, ['signin', 'signup', 'reset', 'confirm'].includes(action) ? 5 : 20)
    const input = body(req)
    const auth = client(req, res)
    if (['signin', 'signup', 'reset'].includes(action)) {
      const email = text(input.email, 3, 254).trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PublicError('invalid_email')
      await limit(req, `auth-email-${action}`, 10, 900, email.toLowerCase())
      if (action === 'reset') {
        await auth.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/confirm` })
        return res.status(200).json({ ok: true, message: 'check_email' })
      }
      const password = text(input.password, action === 'signup' ? 12 : 1, 128)
      const result = action === 'signup'
        ? await auth.auth.signUp({ email, password, options: { emailRedirectTo: `${origin()}/auth/confirm` } })
        : await auth.auth.signInWithPassword({ email, password })
      if (action === 'signup') {
        // Always generic: no email enumeration and no unverified automatic session.
        return res.status(200).json({ ok: true, message: 'check_email' })
      }
      if (result.error || !result.data.user?.email_confirmed_at) throw new PublicError('invalid_credentials', 401)
      saveSession(res, result.data.session)
      return res.status(200).json({ ok: true })
    }
    if (action === 'confirm') {
      if (!['signup', 'recovery', 'email_change'].includes(input.type)) throw new PublicError('invalid_input')
      const result = await auth.auth.verifyOtp({ token_hash: text(input.token_hash, 20, 512), type: input.type })
      if (result.error) throw new PublicError('invalid_or_expired_link', 401)
      if (input.type === 'email_change' && !result.data.session) return res.status(200).json({ ok: true, message: 'check_email' })
      saveSession(res, result.data.session)
      return res.status(200).json({ ok: true, recovery: input.type === 'recovery' })
    }
    if (action === 'oauth' || action === 'link') {
      const provider = input.provider
      if (!['google', 'apple'].includes(provider) || !capabilities()[provider]) throw new PublicError('provider_unavailable', 503)
      let authClient = auth
      if (action === 'link') {
        if (!capabilities().linking) throw new PublicError('provider_unavailable', 503)
        const session = await authenticated(req, res)
        requireRecent(session.token)
        authClient = session.db
      }
      const options = { redirectTo: `${origin()}/api/auth?action=callback`, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } }
      const result = action === 'link' ? await authClient.auth.linkIdentity({ provider, options }) : await authClient.auth.signInWithOAuth({ provider, options })
      if (result.error || !result.data.url) throw new PublicError('authentication_failed', 401)
      return res.status(200).json({ ok: true, url: result.data.url })
    }
    const { db, user, token } = await authenticated(req, res)
    if (action === 'password') {
      // Recovery sessions may change passwords, but may not delete accounts/change email.
      const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
      const recovery = claims.amr?.some((m) => ['recovery', 'otp'].includes(m.method) && m.timestamp > Date.now() / 1000 - 300)
      if (!recovery) requireRecent(token)
      check(await db.auth.updateUser({ password: text(input.password, 12, 128) }))
      try {
        const result = await db.auth.signOut({ scope: 'global' })
        if (result.error) throw new PublicError('session_revocation_failed', 503)
      } finally { clearSession(res) }
      return res.status(200).json({ ok: true, signedOut: true })
    }
    if (action === 'email') {
      requireRecent(token)
      const email = text(input.email, 3, 254).trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PublicError('invalid_email')
      check(await db.auth.updateUser({ email }, { emailRedirectTo: `${origin()}/auth/confirm` }))
      return res.status(200).json({ ok: true, message: 'check_email' })
    }
    if (action === 'delete') {
      requireRecent(token)
      if (input.confirmation !== 'DELETE' || !capabilities().deletion) throw new PublicError('confirmation_required')
      const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) } })
      check(await admin.auth.admin.deleteUser(user.id))
      clearSession(res)
      return res.status(200).json({ ok: true })
    }
    throw new PublicError('unknown_action', 404)
  } catch (error) {
    if (req.method === 'GET' && new URL(req.url, origin()).searchParams.get('action') === 'callback') {
      res.setHeader('Location', '/signin?auth_error=1')
      return res.status(303).end()
    }
    return fail(res, error)
  }
}

import { authenticated, capabilities, check } from './_account/client.js'
import { headers, mutation, body, origin, limit, fail, text, PublicError } from './_account/security.js'

// Admin BFF. EVERY action authorizes server-side: the caller's role is read from the
// database (dv_current_role), never trusted from the request body. Privileged reads/writes
// go through SECURITY DEFINER functions that re-check the role in the DB. A `role` field
// sent by the browser is ignored entirely.
const ROLES = { user: 0, admin: 1, super_admin: 2 }

// Operational platform health — only status strings, NEVER secret values.
function platformHealth(caps) {
  const cfg = (v) => (v ? 'configured' : 'not_configured')
  return {
    website: 'healthy',
    supabase: caps.account ? 'active' : 'disabled',
    database: caps.account ? 'active' : 'disabled',
    accounts: caps.account ? 'active' : 'disabled',
    google_oauth: caps.google ? 'active' : 'disabled',
    apple_oauth: caps.apple ? 'active' : 'disabled',
    email: caps.account ? 'active' : 'disabled',
    assistant: caps.assistant ? 'active' : 'disabled',
    account_deletion: cfg(Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)),
    openai: cfg(Boolean(process.env.OPENAI_API_KEY)),
  }
}

// Read-only view of the real feature flags (booleans only, no env values).
function featureFlags() {
  return {
    ACCOUNT_ENABLED: process.env.ACCOUNT_ENABLED === 'true',
    ASSISTANT_ENABLED: process.env.ASSISTANT_ENABLED === 'true',
    AUTH_GOOGLE_ENABLED: process.env.AUTH_GOOGLE_ENABLED === 'true',
    AUTH_APPLE_ENABLED: process.env.AUTH_APPLE_ENABLED === 'true',
    AUTH_LINKING_ENABLED: process.env.AUTH_LINKING_ENABLED === 'true',
  }
}

export default async function handler(req, res) {
  headers(res)
  try {
    const params = new URL(req.url, origin()).searchParams
    const action = params.get('action') || 'config'
    if (!['config', 'metrics', 'users', 'audit', 'health', 'set-role'].includes(action)) throw new PublicError('unknown_action', 404)
    if (req.method !== 'GET') mutation(req)

    const { db, user } = await authenticated(req, res)
    await limit(req, 'admin', 120, 60, user.id)

    // Authoritative role from the DB. The browser cannot influence this.
    const role = check(await db.rpc('dv_current_role'))
    const level = ROLES[role] ?? 0
    const caps = capabilities()

    if (action === 'config') {
      // Always safe to return: tells the frontend whether to expose /admin at all.
      return res.status(200).json({ ok: true, role, isAdmin: level >= 1, isSuperAdmin: level >= 2 })
    }

    // Everything below requires at least admin. Block at the API layer AND the DB layer.
    if (level < 1) throw new PublicError('forbidden', 403)

    if (req.method === 'GET') {
      if (action === 'metrics') {
        const metrics = check(await db.rpc('dv_admin_metrics'))
        return res.status(200).json({ ok: true, metrics })
      }
      if (action === 'health') {
        return res.status(200).json({ ok: true, health: platformHealth(caps), flags: featureFlags() })
      }
      if (action === 'audit') {
        const rows = check(await db.rpc('dv_admin_audit_list', { lim: 50 }))
        return res.status(200).json({ ok: true, rows })
      }
      if (action === 'users') {
        const search = params.has('search') ? text(params.get('search'), 0, 100) : null
        const page = Math.max(0, Math.min(1000, Number(params.get('page') || 0) | 0))
        const rows = check(await db.rpc('dv_admin_users', { search, lim: 50, off: page * 50 }))
        return res.status(200).json({ ok: true, rows, page })
      }
      throw new PublicError('unknown_action', 404)
    }

    await limit(req, 'admin-mutations', 30, 60, user.id)
    const input = body(req)
    if (action === 'set-role') {
      // super_admin only — enforced again inside dv_admin_set_role.
      if (level < 2) throw new PublicError('forbidden', 403)
      const target = text(input.target, 36, 36)
      if (!/^[0-9a-f-]{36}$/i.test(target)) throw new PublicError('invalid_input')
      const newRole = input.role
      if (!['user', 'admin', 'super_admin'].includes(newRole)) throw new PublicError('invalid_role')
      const result = check(await db.rpc('dv_admin_set_role', { target, new_role: newRole }))
      return res.status(200).json({ ok: true, ...result })
    }
    throw new PublicError('unknown_action', 404)
  } catch (error) {
    // dv_require_role / dv_admin_set_role raise SQL errors → map to safe statuses.
    if (error && typeof error.message === 'string') {
      if (/forbidden|not_authenticated|permission denied/i.test(error.message)) return fail(res, new PublicError('forbidden', 403))
      if (/last_super_admin/i.test(error.message)) return fail(res, new PublicError('last_super_admin', 409))
      if (/invalid_role/i.test(error.message)) return fail(res, new PublicError('invalid_role', 400))
      if (/user_not_found/i.test(error.message)) return fail(res, new PublicError('user_not_found', 404))
    }
    return fail(res, error)
  }
}

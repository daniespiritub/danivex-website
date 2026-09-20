import { authenticated, check } from './_account/client.js'
import { headers, mutation, body, origin, limit, fail, text, PublicError } from './_account/security.js'
import { resources, normalizeHandle } from './_account/resources.js'

const tables = Object.freeze({ favorites: 'dv_favorites', saved: 'dv_saved', downloads: 'dv_downloads', chats: 'dv_chats', support: 'dv_support', activity: 'dv_activity' })
const columns = { favorites: 'id,resource_type,resource_id,created_at', saved: 'id,kind,title,payload,created_at', downloads: 'id,resource_id,version,status,created_at', chats: 'id,question,answer,created_at', support: 'id,subject,message,status,attachment_consent,created_at', activity: 'id,kind,created_at' }

export default async function handler(req, res) {
  headers(res)
  try {
    const params = new URL(req.url, origin()).searchParams
    const action = params.get('action') || 'overview'
    if (!['overview', 'profile', 'handle-availability', 'clear-chats', 'remove', 'favorite', 'save', 'download', 'support', ...Object.keys(tables)].includes(action)) throw new PublicError('unknown_action', 404)
    if (req.method !== 'GET') mutation(req)
    const { db, user } = await authenticated(req, res)
    await limit(req, 'account-user', 120, 60, user.id)
    if (req.method === 'GET') {
      if (action === 'overview') {
        const counts = {}
        for (const key of ['favorites', 'saved', 'downloads']) {
          const result = await db.from(tables[key]).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
          check(result); counts[key] = result.count
        }
        const activity = check(await db.from('dv_activity').select('id,kind,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5))
        return res.status(200).json({ ok: true, counts, activity, resources: Object.values(resources) })
      }
      if (!tables[action]) throw new PublicError('unknown_action', 404)
      let query = db.from(tables[action]).select(columns[action]).eq('user_id', user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(31)
      if (params.has('cursor')) {
        let cursor
        try { cursor = JSON.parse(Buffer.from(params.get('cursor'), 'base64url').toString()) } catch { throw new PublicError('invalid_cursor') }
        if (!/^[0-9a-f-]{36}$/i.test(cursor.id || '') || !/^\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?$/.test(cursor.at || '') || !Number.isFinite(Date.parse(cursor.at))) throw new PublicError('invalid_cursor')
        query = query.or(`created_at.lt.${cursor.at},and(created_at.eq.${cursor.at},id.lt.${cursor.id})`)
      }
      const all = check(await query)
      const rows = all.slice(0, 30)
      const last = rows.at(-1)
      const next = all.length > 30 ? Buffer.from(JSON.stringify({ at: last.created_at, id: last.id })).toString('base64url') : null
      return res.status(200).json({ ok: true, rows, next })
    }
    await limit(req, 'account-mutations', 30)
    const input = body(req)
    if (action === 'handle-availability') {
      await limit(req, 'handle-availability', 20, 60, user.id)
      const handle = normalizeHandle(input.handle)
      if (!handle) throw new PublicError('invalid_handle')
      const available = check(await db.rpc('dv_handle_available', { candidate: handle }))
      return res.status(200).json({ ok: true, handle, available })
    }
    if (action === 'profile') {
      const updates = {}
      if (input.handle !== undefined) {
        const handle = normalizeHandle(input.handle)
        if (!handle) throw new PublicError('invalid_handle')
        updates.handle = handle
      }
      if (input.language !== undefined) {
        if (!['es', 'en', 'it', 'pt'].includes(input.language)) throw new PublicError('invalid_input')
        updates.language = input.language
      }
      if (input.chat_history_enabled !== undefined) {
        if (typeof input.chat_history_enabled !== 'boolean') throw new PublicError('invalid_input')
        updates.chat_history_enabled = input.chat_history_enabled
      }
      if (!Object.keys(updates).length) throw new PublicError('invalid_input')
      check(await db.from('dv_profiles').update(updates).eq('user_id', user.id))
    } else {
      const profile = check(await db.from('dv_profiles').select('handle').eq('user_id', user.id).single())
      if (!profile.handle) throw new PublicError('onboarding_required', 403)
      if (action === 'clear-chats') check(await db.from('dv_chats').delete().eq('user_id', user.id))
      else if (action === 'remove') {
        if (!tables[input.collection]) throw new PublicError('invalid_input')
        if (!/^[0-9a-f-]{36}$/i.test(input.id || '')) throw new PublicError('invalid_input')
        check(await db.from(tables[input.collection]).delete().eq('user_id', user.id).eq('id', input.id))
      } else if (action === 'favorite') {
        const resource = resources[input.resource_id]
        if (!resource) throw new PublicError('invalid_resource')
        check(await db.from('dv_favorites').insert({ resource_id: resource.id, resource_type: resource.type }))
      } else if (action === 'save') {
        if (!['sensitivity', 'preset', 'article'].includes(input.kind)) throw new PublicError('invalid_input')
        if (!input.payload || Array.isArray(input.payload) || typeof input.payload !== 'object' || JSON.stringify(input.payload).length > 6000) throw new PublicError('invalid_input')
        check(await db.from('dv_saved').insert({ kind: input.kind, title: text(input.title, 1, 100), payload: input.payload }))
      } else if (action === 'download') {
        const resource = resources[input.resource_id]
        if (!resource?.download) throw new PublicError('invalid_resource')
        check(await db.from('dv_downloads').insert({ resource_id: resource.id, version: resource.version }))
        return res.status(200).json({ ok: true, url: resource.download })
      } else if (action === 'support') {
        const consent = input.attachment_consent === true
        check(await db.from('dv_support').insert({ subject: text(input.subject, 3, 100), message: text(input.message, 10, 4000), attachment_consent: consent, conversation: consent && input.conversation ? text(input.conversation, 1, 8000) : null }))
      } else throw new PublicError('unknown_action', 404)
    }
    return res.status(200).json({ ok: true })
  } catch (error) { return fail(res, error) }
}

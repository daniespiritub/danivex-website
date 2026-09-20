import { Redis } from '@upstash/redis'
import { capabilities, authenticated, check } from './_account/client.js'
import { headers, mutation, body, limit, fail, text, PublicError } from './_account/security.js'
import { retrieve } from './_account/knowledge.js'
import { respond } from './_account/assistant.js'

export default async function handler(req, res) {
  headers(res)
  try {
    mutation(req)
    if (!capabilities().assistant) throw new PublicError('assistant_unavailable', 503)
    await limit(req, 'assistant', 8, 600)
    const input = body(req)
    const message = text(input.message, 1, 2000).trim()
    if (!message) throw new PublicError('invalid_input')
    const page = ['/', '/player-scanner', '/account', '/privacy'].includes(input.page) ? input.page : '/'
    const language = ['es', 'en', 'it', 'pt'].includes(input.language) ? input.language : 'es'
    const consent = input.private_context === true
    const account = consent || input.save === true ? await authenticated(req, res) : null
    if (account) {
      const profile = check(await account.db.from('dv_profiles').select('handle').eq('user_id', account.user.id).single())
      if (!profile.handle) throw new PublicError('onboarding_required', 403)
    }
    // Global budget gate is independent of IP rotation and fails closed.
    const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN, retry: false, signal: () => AbortSignal.timeout(3000) })
    const count = await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],86400) end; return n", [`${process.env.VERCEL_ENV || 'development'}:assistant:daily:${new Date().toISOString().slice(0, 10)}`], [])
    const budget = Math.min(1000, Math.max(1, Number(process.env.ASSISTANT_DAILY_LIMIT) || 200))
    if (Number(count) > budget) throw new PublicError('assistant_daily_limit', 429)
    const docs = retrieve(message, page)
    const answer = await respond({ message, docs, page, language, account, consent })
    let saved = false
    if (account && input.save === true) {
      const profile = check(await account.db.from('dv_profiles').select('chat_history_enabled').eq('user_id', account.user.id).single())
      if (profile.chat_history_enabled) {
        check(await account.db.from('dv_chats').insert({ question: message, answer }))
        saved = true
      }
    }
    return res.status(200).json({ ok: true, answer, sources: docs.map(({ title, url }) => ({ title, url })), saved })
  } catch (error) { return fail(res, error) }
}

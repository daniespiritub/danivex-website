import test from 'node:test'
import assert from 'node:assert/strict'
import authHandler from '../api/auth.js'
import accountHandler from '../api/account.js'
import assistantHandler from '../api/assistant.js'
import { client, capabilities } from '../api/_account/client.js'

function response() {
  return { headers: {}, code: 200, data: null, setHeader(k, v) { this.headers[k] = v }, getHeader(k) { return this.headers[k] }, status(n) { this.code = n; return this }, json(data) { this.data = data; return this }, end() { return this } }
}
test('BFF: missing configuration fails closed and does not advertise unavailable services', async () => {
  process.env.APP_ORIGIN = 'https://danivex.com'
  process.env.ACCOUNT_ENABLED = 'false'
  process.env.ASSISTANT_ENABLED = 'false'
  assert.equal(capabilities().account, false)
  const config = response()
  await authHandler({ url: '/api/auth?action=config', method: 'GET', headers: {} }, config)
  assert.equal(config.code, 200)
  assert.equal(config.data.account, false)
  assert.equal(config.data.assistant, false)
  assert.equal(config.headers['Cache-Control'], 'private, no-store')
  assert.equal(config.headers['Access-Control-Allow-Origin'], undefined)
  const res = response()
  await accountHandler({ url: '/api/account', method: 'GET', headers: {} }, res)
  assert.equal(res.code, 503)
  assert.equal(res.data.error, 'account_unavailable')
})
test('BFF: CSRF and public exceptions cannot expose internals', async () => {
  for (const handler of [authHandler, accountHandler, assistantHandler]) {
    const res = response()
    await handler({ url: '/api/auth', method: 'POST', headers: { origin: 'https://evil.test', 'content-type': 'application/json' }, body: {} }, res)
    assert.equal(res.code, 403)
    assert.deepEqual(res.data, { ok: false, error: 'origin_rejected' })
    assert.doesNotMatch(JSON.stringify(res.data), /stack|token|password|filesystem|SQL/)
  }
})
test('BFF: actual Supabase SDK PKCE verifier slots survive separate server requests', async () => {
  process.env.ACCOUNT_ENABLED = 'true'
  process.env.SUPABASE_URL = 'https://test-project.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'test-only-publishable'
  process.env.KV_REST_API_URL = 'https://test.upstash.io'
  process.env.KV_REST_API_TOKEN = 'test-only-token'
  process.env.RATE_LIMIT_SECRET = 'test-only-secret'.repeat(3)
  const originalFetch = global.fetch
  try {
    const res = response()
    const db = client({ headers: {} }, res)
    const result = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://danivex.com/api/auth?action=callback', skipBrowserRedirect: true } })
    assert.equal(result.error, null)
    const target = new URL(result.data.url)
    assert.ok(target.searchParams.get('code_challenge'))
    assert.equal(target.searchParams.get('code_challenge_method'), 's256')
    const callback = new URL(target.searchParams.get('redirect_to'))
    const flowId = callback.searchParams.get('sb_flow_id')
    assert.ok(flowId)
    const jar = res.headers['Set-Cookie'].map((v) => v.split(';')[0]).join('; ')
    assert.match(jar, /flow-.*-code-verifier/)
    global.fetch = async (url, init) => {
      assert.match(String(url), /\/token\?grant_type=pkce/)
      const input = JSON.parse(init.body)
      assert.ok(input.code_verifier.length >= 43)
      return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Test code, no external request made' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    const next = client({ headers: { cookie: jar } }, response())
    const exchange = await next.auth.exchangeCodeForSession('test-code', { flowId })
    assert.ok(exchange.error)
    assert.notEqual(exchange.error.name, 'AuthPKCECodeVerifierMissingError')
  } finally { global.fetch = originalFetch; process.env.ACCOUNT_ENABLED = 'false' }
})

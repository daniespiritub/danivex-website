import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { mutation, body, setCookie, requireRecent, PublicError } from '../api/_account/security.js'
import { validHandle } from '../api/_account/resources.js'
import { privateTool, respond } from '../api/_account/assistant.js'

test('CSP allows local GLB texture fetches without external API connections', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  const policy = config.headers.flatMap((rule) => rule.headers).find((h) => h.key === 'Content-Security-Policy').value
  const directives = new Map(policy.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/)
    return [name, values]
  }))
  assert.deepEqual(directives.get('connect-src'), ["'self'", 'blob:'])
  assert.deepEqual(directives.get('script-src'), ["'self'", "'wasm-unsafe-eval'"])
  assert.deepEqual(directives.get('object-src'), ["'none'"])
  assert.deepEqual(config.redirects[0], {
    source: '/:path*', has: [{ type: 'host', value: 'www.danivex.com' }],
    destination: 'https://danivex.com/:path*', permanent: true,
  })
})

test('account: strict origin, method, JSON and size checks', () => {
  process.env.APP_ORIGIN = 'https://danivex.com'
  const req = { method: 'POST', headers: { origin: 'https://danivex.com', 'content-type': 'application/json' }, body: { action: 'test' } }
  assert.doesNotThrow(() => mutation(req))
  for (const origin of ['', 'null', 'https://evil.test', 'https://danivex.com.evil.test', 'https://sub.danivex.com']) assert.throws(() => mutation({ ...req, headers: { ...req.headers, origin } }), PublicError)
  assert.throws(() => mutation({ ...req, method: 'GET' }), /method_not_allowed/)
  assert.throws(() => mutation({ ...req, headers: { ...req.headers, 'content-type': 'text/plain' } }), /json_required/)
  assert.throws(() => body({ ...req, body: { data: 'x'.repeat(17000) } }), /request_too_large/)
  assert.throws(() => body({ ...req, body: '{' }), /invalid_json/)
})

test('account: secure cookies and recent authentication exclude recovery', () => {
  const res = { value: [], getHeader() { return this.value }, setHeader(k, v) { this.value = v } }
  setCookie(res, 'access', 'private')
  assert.match(res.value[0], /^__Host-dv-access=private; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure$/)
  const token = (method, seconds = 0) => `x.${Buffer.from(JSON.stringify({ amr: [{ method, timestamp: Date.now() / 1000 - seconds }] })).toString('base64url')}.x`
  assert.doesNotThrow(() => requireRecent(token('password')))
  for (const tokenValue of [token('password', 301), token('recovery'), 'bad']) assert.throws(() => requireRecent(tokenValue), /reauthentication_required/)
})

test('account: handle validation preserves casing but rejects reserved/Unicode/spacing', () => {
  for (const handle of ['Dani_player', 'abc', 'Player123']) assert.equal(validHandle(handle), true)
  for (const handle of ['Admin', 'DANIVEX', 'ab', 'a'.repeat(17), 'mi cuenta', 'José', '<script>']) assert.equal(validHandle(handle), false)
})

test('assistant: arbitrary tools and private queries without consent are rejected', async () => {
  for (const call of [{ name: 'sql', arguments: '{}' }, { name: 'get_my_summary', arguments: '{"user_id":"victim"}' }]) await assert.rejects(privateTool(call, {}, true), /tool_not_authorized/)
  await assert.rejects(privateTool({ name: 'get_my_summary', arguments: '{}' }, null, true), /tool_not_authorized/)
  await assert.rejects(privateTool({ name: 'get_my_summary', arguments: '{}' }, {}, false), /tool_not_authorized/)
})

test('assistant: provider request has no private identity/history and is not stored', async () => {
  let request
  const answer = await respond({ message: 'Sensitivity?', docs: [], page: '/', language: 'en', account: { user: { id: 'secret-uuid', email: 'secret@example.test' } }, consent: false, fetcher: async (url, init) => {
    request = JSON.parse(init.body)
    assert.equal(url, 'https://api.openai.com/v1/responses')
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: 'Use the sensitivity tool.' }] }] }) }
  } })
  assert.equal(answer, 'Use the sensitivity tool.')
  assert.equal(request.store, false)
  assert.deepEqual(request.tools, [])
  assert.doesNotMatch(JSON.stringify(request), /secret-uuid|secret@example/)
  await assert.rejects(respond({ message: 'hi', docs: [], fetcher: async () => ({ ok: false }) }), /assistant_unavailable/)
})

test('PostgreSQL RLS: real migration, A/B/anon, constraints, opt-out and deletion', async () => {
  const db = new PGlite()
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;`)
    await db.exec(await readFile(new URL('../supabase/migrations/202609190001_accounts.sql', import.meta.url), 'utf8'))
    await db.query('insert into auth.users(id) values ($1),($2)', [A, B])
    const asUser = async (uid) => { await db.exec('reset role; set role authenticated;'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]) }
    const select = async (table) => (await db.query(`select * from public.${table}`)).rows
    const tables = ['dv_profiles', 'dv_favorites', 'dv_saved', 'dv_downloads', 'dv_chats', 'dv_support', 'dv_activity']
    for (const [uid, handle] of [[A, 'PlayerA'], [B, 'PlayerB']]) {
      await asUser(uid)
      await db.query('update dv_profiles set handle=$1,chat_history_enabled=true', [handle])
      await db.exec(`insert into dv_favorites(resource_type,resource_id) values ('tool','scanner');
        insert into dv_saved(kind,title,payload) values ('sensitivity','My preset','{"general":120}');
        insert into dv_downloads(resource_id,version) values ('mobilador','0.0.0.1');
        insert into dv_chats(question,answer) values ('hello','response');
        insert into dv_support(subject,message) values ('Question','A valid support message');
        insert into dv_activity(kind) values ('saved');`)
      for (const table of tables) {
        const rows = await select(table)
        assert.equal(rows.length, table === 'dv_activity' ? 4 : 1, `${handle}: only own ${table}`)
        assert.equal(rows[0].user_id, uid)
        await assert.rejects(db.query(`insert into ${table}(user_id) values ($1)`, [uid === A ? B : A]), /permission denied|row-level security/)
      }
    }
    await asUser(B)
    await assert.rejects(db.exec("update dv_profiles set handle='playera'"), /unique constraint/)
    await assert.rejects(db.exec("update dv_profiles set handle='Admin'"), /reserved_handle/)
    await assert.rejects(db.exec("update dv_profiles set handle='ééé'"), /check constraint/)
    await assert.rejects(db.exec("update dv_profiles set created_at='2000-01-01'"), /permission denied/)
    await assert.rejects(db.exec("insert into dv_favorites(resource_type,resource_id) values ('tool','scanner')"), /unique constraint/)
    await assert.rejects(db.exec("insert into dv_support(subject,message,conversation) values ('subject','valid message','private transcript')"), /check constraint/)
    await db.exec('update dv_profiles set chat_history_enabled=false')
    assert.equal((await select('dv_chats')).length, 0)
    await assert.rejects(db.exec("insert into dv_chats(question,answer) values ('hello','response')"), /row-level security/)
    for (const table of tables.filter((x) => x !== 'dv_profiles')) assert.equal((await db.query(`delete from ${table} where user_id=$1 returning id`, [A])).rows.length, 0)
    await asUser(A)
    for (const table of tables) assert.equal((await select(table)).length, table === 'dv_activity' ? 4 : 1, `B did not delete A ${table}`)
    await db.exec('reset role; set role anon;')
    for (const table of tables) await assert.rejects(select(table), /permission denied/)
    await db.exec('reset role;')
    await db.query('delete from auth.users where id=$1', [A])
    for (const table of tables) assert.equal((await db.query(`select * from ${table} where user_id=$1`, [A])).rows.length, 0, `cascade ${table}`)
  } finally { await db.close() }
})

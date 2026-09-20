import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Only explicit execution creates disposable, admin-confirmed users. It does not
// prove SMTP delivery, OAuth, browser BFF behavior or real OpenAI responses.
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.log(JSON.stringify({ status: 'NOT VERIFIED', missing }))
  process.exitCode = 2
} else if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({ status: 'CONFIGURATION PRESENT; NOT VERIFIED', next: 'Run with --execute against the approved migrated staging project.' }))
} else {
  const url = new URL(process.env.SUPABASE_URL)
  assert.equal(url.protocol, 'https:', 'Hosted acceptance requires HTTPS')
  const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init = {}) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) } }
  const admin = createClient(url.origin, process.env.SUPABASE_SERVICE_ROLE_KEY, options)
  const people = []
  const checks = []
  let cleanup = true
  const check = (result) => { if (result.error) throw new Error('provider_operation_failed'); return result.data }
  const tables = ['dv_profiles', 'dv_favorites', 'dv_saved', 'dv_downloads', 'dv_activity', 'dv_chats', 'dv_support']
  try {
    for (const suffix of ['a', 'b']) {
      const nonce = randomUUID().replaceAll('-', '').slice(0, 10)
      const email = `dv-acceptance-${nonce}-${suffix}@example.invalid`
      const password = randomBytes(32).toString('base64url')
      const created = check(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { purpose: 'danivex-disposable-acceptance' } }))
      const db = createClient(url.origin, process.env.SUPABASE_ANON_KEY, options)
      const person = { id: created.user.id, db }
      people.push(person)
      person.session = check(await db.auth.signInWithPassword({ email, password })).session
      assert.equal(check(await db.rpc('dv_session_active')), true)
      check(await db.from('dv_profiles').update({ handle: `qa_${nonce}_${suffix}`, chat_history_enabled: true }).eq('user_id', person.id))
      check(await db.from('dv_favorites').insert({ resource_type: 'tool', resource_id: 'scanner' }))
      check(await db.from('dv_saved').insert({ kind: 'sensitivity', title: 'Disposable acceptance', payload: { values: { general: 120 } } }))
      check(await db.from('dv_downloads').insert({ resource_id: 'mobilador', version: 'acceptance-test' }))
      check(await db.from('dv_chats').insert({ question: 'Controlled fixture', answer: 'No model call made' }))
      check(await db.from('dv_support').insert({ subject: 'Disposable acceptance', message: 'Controlled test, no support action needed.' }))
    }
    for (const [owner, other] of [[people[0], people[1]], [people[1], people[0]]]) {
      for (const table of tables) {
        const ownRows = check(await owner.db.from(table).select('*'))
        assert.ok(ownRows.length > 0 && ownRows.every((row) => row.user_id === owner.id))
        assert.deepEqual(check(await owner.db.from(table).select('*').eq('user_id', other.id)), [])
        if (table !== 'dv_profiles') assert.deepEqual(check(await owner.db.from(table).delete().eq('user_id', other.id).select('id')), [])
      }
      assert.ok((await owner.db.from('dv_favorites').insert({ user_id: other.id, resource_type: 'tool', resource_id: 'scanner' })).error)
      assert.ok((await owner.db.from('dv_saved').update({ title: 'blocked' }).eq('user_id', other.id)).error)
      check(await owner.db.auth.refreshSession())
      assert.equal(check(await owner.db.rpc('dv_session_active')), true)
      checks.push('owned persistence, cross-user SELECT/INSERT/UPDATE/DELETE isolation and refresh')
    }
    const victim = people[0]
    const stale = createClient(url.origin, process.env.SUPABASE_ANON_KEY, { ...options, global: { ...options.global, headers: { Authorization: `Bearer ${victim.session.access_token}` } } })
    check(await victim.db.auth.signOut({ scope: 'global' }))
    assert.equal(check(await stale.rpc('dv_session_active')), false)
    assert.deepEqual(check(await stale.from('dv_saved').select('*')), [])
    checks.push('revoked JWT denied immediately by database policies')
  } catch {
    process.exitCode = 1
    console.error('FAIL: live acceptance failed; provider details and credentials withheld.')
  } finally {
    for (const person of people) {
      const result = await admin.auth.admin.deleteUser(person.id).catch(() => ({ error: true }))
      if (result.error) cleanup = false
      for (const table of tables) {
        const result = await admin.from(table).select('user_id').eq('user_id', person.id)
        if (result.error || result.data.length) cleanup = false
      }
    }
    if (!cleanup) process.exitCode = 1
    console.log(JSON.stringify({ status: process.exitCode === 1 ? 'FAIL' : 'PASS: hosted Auth/PostgREST only', checks, disposableUsersRemoved: cleanup, notVerified: ['email delivery/verification', 'Google', 'Apple', 'browser BFF E2E', 'OpenAI'] }, null, 2))
  }
}

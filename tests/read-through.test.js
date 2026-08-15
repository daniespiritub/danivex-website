import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveProfile } from '../api/_lib/read-through.js'

const stored = { nickname: 'DaniメPepito', lastObservedAt: '2026-08-15T11:00:00.000Z', contentHash: 'abc123' }

const refreshOk = (response, spy) => async () => { if (spy) spy.called = true; return { ok: true, response, provider: 'freefirejornal', fallback: true } }
const refreshFail = (reason, spy) => async () => { if (spy) spy.called = true; return { ok: false, reason } }
const persistSpy = () => { const s = { persisted: undefined }; return { fn: async (r) => { s.persisted = r }, s } }

test('fresh stored => NO llama provider ni persiste', async () => {
  const rspy = { called: false }
  const { fn, s } = persistSpy()
  const r = await resolveProfile({ stored, freshness: 'fresh', refresh: refreshOk({}, rspy), persist: fn })
  assert.equal(r.servedFrom, 'cache_fresh')
  assert.equal(rspy.called, false)
  assert.equal(s.persisted, undefined)
  assert.deepEqual(r.cache, { hit: true, state: 'fresh' })
})

test('missing => llama provider', async () => {
  const rspy = { called: false }
  const { fn } = persistSpy()
  const r = await resolveProfile({ stored: null, freshness: 'unknown', refresh: refreshOk({ nickname: 'X' }, rspy), persist: fn })
  assert.equal(rspy.called, true)
  assert.equal(r.servedFrom, 'provider')
})

test('stale + provider success => persiste el resultado fresh', async () => {
  const { fn, s } = persistSpy()
  const fresh = { nickname: 'DaniメPepito', level: '86' }
  const r = await resolveProfile({ stored, freshness: 'stale', refresh: refreshOk(fresh), persist: fn })
  assert.equal(r.servedFrom, 'provider')
  assert.equal(s.persisted, fresh)
  assert.equal(r.cache.state, 'fresh')
})

test('stale + provider failure => devuelve stored stale, NO persiste, hash intacto', async () => {
  const { fn, s } = persistSpy()
  const r = await resolveProfile({ stored, freshness: 'stale', refresh: refreshFail('provider_error'), persist: fn })
  assert.equal(r.servedFrom, 'cache_stale')
  assert.equal(r.profile, stored)
  assert.equal(r.profile.contentHash, 'abc123')
  assert.equal(s.persisted, undefined)
  assert.deepEqual(r.cache, { hit: true, state: 'stale', fallback: true })
})

test('expired + provider failure => fallo normal (NO usa expired como fallback)', async () => {
  const { fn, s } = persistSpy()
  const r = await resolveProfile({ stored: { ...stored, lastObservedAt: '2020-01-01T00:00:00.000Z' }, freshness: 'expired', refresh: refreshFail('provider_error'), persist: fn })
  assert.equal(r.servedFrom, 'none')
  assert.equal(s.persisted, undefined)
})

test('rate-limited refresh: sirve stale si existe; none si no hay stored', async () => {
  const r1 = await resolveProfile({ stored, freshness: 'stale', refresh: refreshFail('rate_limited'), persist: async () => {} })
  assert.equal(r1.servedFrom, 'cache_stale')
  const r2 = await resolveProfile({ stored: null, freshness: 'unknown', refresh: refreshFail('rate_limited'), persist: async () => {} })
  assert.equal(r2.servedFrom, 'none')
})

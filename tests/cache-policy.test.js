import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyFreshness, PROFILE_FRESH_TTL_MS, PROFILE_STALE_MAX_AGE_MS } from '../api/_lib/cache-policy.js'

const now = Date.parse('2026-08-15T12:00:00.000Z')
const iso = (msAgo) => new Date(now - msAgo).toISOString()

test('fresh: dentro del fresh TTL', () => {
  assert.equal(classifyFreshness(iso(0), now), 'fresh')
  assert.equal(classifyFreshness(iso(PROFILE_FRESH_TTL_MS - 1000), now), 'fresh')
})

test('stale: entre fresh TTL y stale max', () => {
  assert.equal(classifyFreshness(iso(PROFILE_FRESH_TTL_MS + 1000), now), 'stale')
  assert.equal(classifyFreshness(iso(PROFILE_STALE_MAX_AGE_MS - 1000), now), 'stale')
})

test('expired: mas viejo que stale max', () => {
  assert.equal(classifyFreshness(iso(PROFILE_STALE_MAX_AGE_MS + 1000), now), 'expired')
})

test('unknown: lastObservedAt ausente o invalido', () => {
  assert.equal(classifyFreshness(undefined, now), 'unknown')
  assert.equal(classifyFreshness('', now), 'unknown')
  assert.equal(classifyFreshness('no-es-fecha', now), 'unknown')
})

test('override opts (hook de test no-prod)', () => {
  assert.equal(classifyFreshness(iso(5000), now, { freshTtlMs: 0 }), 'stale')
  assert.equal(classifyFreshness(iso(5000), now, { freshTtlMs: 0, staleMaxAgeMs: 0 }), 'expired')
})

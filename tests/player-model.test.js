import test from 'node:test'
import assert from 'node:assert/strict'
import { MEANINGFUL_FIELDS, normalizeStoredPlayer, stableProfileHash } from '../api/_lib/player-model.js'

test('normalizeStoredPlayer: mapea campos y aplica defaults', () => {
  const p = normalizeStoredPlayer('2196518104', { nickname: 'DaniメPepito', likes: '24197', provider: 'FreeFireJornal Perfil' })
  assert.equal(p.uid, '2196518104')
  assert.equal(p.nickname, 'DaniメPepito')
  assert.equal(p.likes, 24197)
  assert.equal(typeof p.likes, 'number')
  assert.equal(p.region, '')
  assert.equal(p.creationDate, null)
  assert.equal(p.provider, 'FreeFireJornal Perfil')
})

test('normalizeStoredPlayer: sin provider usa "Public source"', () => {
  assert.equal(normalizeStoredPlayer('1', { nickname: 'x' }).provider, 'Public source')
})

test('stableProfileHash: consistente con MEANINGFUL_FIELDS (volatiles no afectan)', () => {
  const base = { nickname: 'x', level: '85', likes: 10 }
  const withVolatile = { ...base, lastLogin: 'hoy', accountAge: '6 anios', provider: 'otro' }
  assert.equal(stableProfileHash(base), stableProfileHash(withVolatile))
  assert.notEqual(stableProfileHash(base), stableProfileHash({ ...base, level: '86' }))
  assert.ok(MEANINGFUL_FIELDS.includes('level'))
  assert.ok(!MEANINGFUL_FIELDS.includes('lastLogin'))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { detectPlayerEvents } from '../api/_lib/change-detection.js'

const base = { nickname: 'DaniメPepito', level: '85', likes: 24197, clanId: '2060675720', clan: 'PorN', avatar: 'a', banner: 'b', bio: 'hi', primeLevel: '', region: 'US' }
const types = (evs) => evs.map((e) => e.type)

test('identico => sin eventos', () => {
  assert.deepEqual(detectPlayerEvents(base, { ...base }), [])
})

test('prev/next nulo => sin eventos (primera observacion)', () => {
  assert.deepEqual(detectPlayerEvents(null, base), [])
  assert.deepEqual(detectPlayerEvents(base, null), [])
})

test('nickname => NICKNAME_CHANGED', () => {
  const evs = detectPlayerEvents(base, { ...base, nickname: 'NuevoNick' })
  assert.deepEqual(types(evs), ['NICKNAME_CHANGED'])
  assert.equal(evs[0].from, 'DaniメPepito')
  assert.equal(evs[0].to, 'NuevoNick')
})

test('nivel sube => LEVEL_UP; baja => LEVEL_CHANGED', () => {
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, level: '86' })), ['LEVEL_UP'])
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, level: '84' })), ['LEVEL_CHANGED'])
})

test('likes => LIKES_CHANGED', () => {
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, likes: 25000 })), ['LIKES_CHANGED'])
})

test('gremio (clanId) => un solo GUILD_CHANGED', () => {
  const evs = detectPlayerEvents(base, { ...base, clanId: '999', clan: 'OtroClan' })
  assert.deepEqual(types(evs), ['GUILD_CHANGED'])
})

test('avatar/banner/bio/prime/region', () => {
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, avatar: 'z' })), ['AVATAR_CHANGED'])
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, banner: 'z' })), ['BANNER_CHANGED'])
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, bio: 'z' })), ['BIO_CHANGED'])
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, primeLevel: '8' })), ['PRIME_CHANGED'])
  assert.deepEqual(types(detectPlayerEvents(base, { ...base, region: 'BR' })), ['REGION_CHANGED'])
})

test('multiples cambios => multiples eventos', () => {
  const evs = detectPlayerEvents(base, { ...base, nickname: 'X', level: '90', likes: 30000 })
  assert.deepEqual(types(evs).sort(), ['LEVEL_UP', 'LIKES_CHANGED', 'NICKNAME_CHANGED'])
})

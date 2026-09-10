import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveProviders, profileProviders } from '../api/_lib/providers/index.js'
import { detectPlayerEvents } from '../api/_lib/change-detection.js'

test('resolveProviders: sin SIAMBHAU_API_KEY solo estan los keyless', () => {
  const prev = process.env.SIAMBHAU_API_KEY
  delete process.env.SIAMBHAU_API_KEY
  const list = resolveProviders().map((p) => p.name)
  assert.ok(!list.includes('siambhau'), 'siambhau NO debe estar sin key')
  assert.deepEqual(list, profileProviders.map((p) => p.name))
  if (prev !== undefined) process.env.SIAMBHAU_API_KEY = prev
})

test('resolveProviders: con SIAMBHAU_API_KEY, siambhau va primero', () => {
  const prev = process.env.SIAMBHAU_API_KEY
  process.env.SIAMBHAU_API_KEY = 'test-key'
  const list = resolveProviders().map((p) => p.name)
  assert.equal(list[0], 'siambhau')
  assert.ok(list.includes('freefiremania'))
  if (prev === undefined) delete process.env.SIAMBHAU_API_KEY
  else process.env.SIAMBHAU_API_KEY = prev
})

test('detectPlayerEvents: detecta cambio de rango BR/CS', () => {
  const prev = { rankBR: 'Heroico', rankCS: 'Diamante I' }
  const next = { rankBR: 'Gran Maestro', rankCS: 'Diamante I' }
  const events = detectPlayerEvents(prev, next)
  const types = events.map((e) => e.type)
  assert.ok(types.includes('RANK_BR_CHANGED'))
  assert.ok(!types.includes('RANK_CS_CHANGED'))
})

test('detectPlayerEvents: detecta cambio de outfit y pet', () => {
  const prev = { outfit: [{ id: '1' }], pet: '100' }
  const next = { outfit: [{ id: '2' }], pet: '200' }
  const types = detectPlayerEvents(prev, next).map((e) => e.type)
  assert.ok(types.includes('OUTFIT_CHANGED'))
  assert.ok(types.includes('PET_CHANGED'))
})

test('detectPlayerEvents: campos ricos vacios (fuente keyless) => sin eventos espurios', () => {
  const prev = { nickname: 'A', rankBR: '', rankCS: '', outfit: [], pet: '' }
  const next = { nickname: 'A', rankBR: '', rankCS: '', outfit: [], pet: '' }
  assert.deepEqual(detectPlayerEvents(prev, next), [])
})

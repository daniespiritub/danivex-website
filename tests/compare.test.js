import test from 'node:test'
import assert from 'node:assert/strict'
import { comparePlayers, compareSummary } from '../src/data/compare.js'

const a = { level: '85', likes: 24197, exp: '11.074.588', region: 'US', accountAge: '6 anios', clan: 'PorN', creationDate: '18 jul 2020' }
const b = { level: '82', likes: 15872, exp: '8.512.274', region: 'SAC', accountAge: '7 anios', clan: '-', creationDate: '13 sep 2018' }

test('comparePlayers: metricas numericas marcan lider correcto', () => {
  const rows = comparePlayers(a, b)
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]))
  assert.equal(byLabel['Nivel'].leader, 'a') // 85 > 82
  assert.equal(byLabel['Me gusta'].leader, 'a') // 24197 > 15872
  assert.equal(byLabel['Experiencia'].leader, 'a') // 11M > 8.5M
  assert.equal(byLabel['Region'].leader, null) // info, sin lider
})

test('comparePlayers: empate numerico => tie', () => {
  const rows = comparePlayers({ level: '85' }, { level: '85' })
  assert.equal(rows.find((r) => r.label === 'Nivel').leader, 'tie')
})

test('comparePlayers: null => []', () => {
  assert.deepEqual(comparePlayers(null, b), [])
  assert.deepEqual(comparePlayers(a, null), [])
})

test('compareSummary: quien lidera mas metricas', () => {
  assert.equal(compareSummary(comparePlayers(a, b)), 'a')
  assert.equal(compareSummary(comparePlayers(b, a)), 'b')
  assert.equal(compareSummary(comparePlayers(a, a)), 'tie')
})

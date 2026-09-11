import test from 'node:test'
import assert from 'node:assert/strict'
import { getPassCatalog, passImage, PASS_MAX } from '../api/_lib/pass-catalog.js'

test('pass-catalog: 98 pases, IDs unicos, Elite 1-55 / Booyah 56-98', () => {
  const cat = getPassCatalog()
  assert.equal(cat.length, PASS_MAX)
  assert.equal(cat.length, 98)
  const ids = new Set(cat.map((p) => p.id))
  assert.equal(ids.size, cat.length, 'IDs unicos')
  const elite = cat.filter((p) => p.system === 'elite-pass')
  const booyah = cat.filter((p) => p.system === 'booyah-pass')
  assert.equal(elite.length, 55)
  assert.equal(booyah.length, 43)
})

test('pass-catalog: nombres reales de Elite Pass (P1 Sakura, P55 Avalanche)', () => {
  const cat = getPassCatalog()
  const byNum = Object.fromEntries(cat.map((p) => [p.num, p]))
  assert.match(byNum[1].name, /Sakura/i)
  assert.match(byNum[2].name, /Hip-hop/i)
  assert.match(byNum[55].name, /Avalanche/i)
  // Booyah sin nombre en la base => etiqueta por numero
  assert.match(byNum[98].name, /Booyah/i)
})

test('pass-catalog: id = 1001000000 + num; imagen por sistema', () => {
  const cat = getPassCatalog()
  const byNum = Object.fromEntries(cat.map((p) => [p.num, p]))
  assert.equal(byNum[1].id, '1001000001')
  assert.equal(byNum[98].id, '1001000098')
  assert.match(passImage(1), /1001000001\.png$/) // Elite via CDN
  assert.match(passImage(98), /passes-badges\/1001000098\.png$/) // Booyah via FFM
})

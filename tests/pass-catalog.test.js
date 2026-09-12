import test from 'node:test'
import assert from 'node:assert/strict'
import { getPassCatalog, passImage, passEntry, PASS_MAX } from '../api/_lib/pass-catalog.js'

test('pass-catalog: PASS_MAX pases, IDs unicos, Elite 1-55 / Booyah 56+', () => {
  const cat = getPassCatalog()
  assert.equal(cat.length, PASS_MAX)
  const ids = new Set(cat.map((p) => p.id))
  assert.equal(ids.size, cat.length, 'IDs unicos')
  const elite = cat.filter((p) => p.system === 'elite-pass')
  const booyah = cat.filter((p) => p.system === 'booyah-pass')
  assert.equal(elite.length, 55)
  assert.equal(booyah.length, PASS_MAX - 55)
})

test('pass-catalog: nombres reales de Elite Pass (P1 Sakura, P55 Avalanche)', () => {
  const byNum = Object.fromEntries(getPassCatalog().map((p) => [p.num, p]))
  assert.match(byNum[1].name, /Sakura/i)
  assert.match(byNum[2].name, /Hip-hop/i)
  assert.match(byNum[55].name, /Avalanche/i)
})

test('pass-catalog: Booyah muestra NOMBRE real, nunca el numero global crudo', () => {
  // P56 = Booyah S1 = "Fumes on Fire"; P98 = Booyah S43 = "Baaast Friends" (verificado por imagen).
  assert.equal(passEntry(56).name, 'Fumes on Fire')
  assert.equal(passEntry(98).name, 'Baaast Friends')
  assert.equal(passEntry(84).name, 'NOODLICIOUS') // S29
  // Ningun nombre de Booyah puede ser el numero global crudo (56/57/98...).
  for (let n = 56; n <= PASS_MAX; n += 1) {
    assert.doesNotMatch(passEntry(n).name, new RegExp(`^${n}$`), `P${n} no debe mostrarse como numero`)
    assert.doesNotMatch(passEntry(n).name, /^Pase Booyah \d+$/, 'nunca "Pase Booyah <global>"')
  }
})

test('pass-catalog: S30..S41 con nombre oficial PT-BR (ya NO fallback generico)', () => {
  assert.equal(passEntry(85).systemSeason, 30)
  assert.equal(passEntry(85).name, 'Nascidos das Chamas') // S30 / P85
  assert.equal(passEntry(90).name, 'Hora Fantasmagórica') // S35 / P90
  assert.equal(passEntry(96).name, 'Sonho Lapidado') // S41 / P96
  // Ninguno de S30..S41 debe caer en el fallback por temporada.
  for (let n = 85; n <= 96; n += 1) {
    assert.doesNotMatch(passEntry(n).name, /^Pase Booyah S\d+$/, `P${n} debe tener nombre real`)
  }
})

test('pass-catalog: temporada sin nombre aun => etiqueta por TEMPORADA (S{n}), no por global', () => {
  // S46 (P101) aun sin nombre publico confirmado => "Pase Booyah S46" (no el numero global).
  const p101 = passEntry(101)
  assert.equal(p101.systemSeason, 46)
  assert.equal(p101.name, 'Pase Booyah S46')
})

test('pass-catalog: DINAMICO — acepta P99, P100+ sin romper', () => {
  const p100 = passEntry(100)
  assert.equal(p100.num, 100)
  assert.equal(p100.system, 'booyah-pass')
  assert.equal(p100.systemSeason, 45)
  assert.equal(p100.name, 'Stellar Spica') // S45
  assert.equal(p100.id, '1001000100')
  const p120 = passEntry(120)
  assert.equal(p120.systemSeason, 65)
  assert.equal(p120.name, 'Pase Booyah S65') // sin nombre aun => etiqueta por temporada
  assert.equal(p120.id, '1001000120')
})

test('pass-catalog: id = 1001000000 + num; imagen por sistema', () => {
  const byNum = Object.fromEntries(getPassCatalog().map((p) => [p.num, p]))
  assert.equal(byNum[1].id, '1001000001')
  assert.equal(byNum[98].id, '1001000098')
  assert.match(passImage(1), /1001000001\.png$/) // Elite via CDN
  assert.match(passImage(98), /passes-badges\/1001000098\.png$/) // Booyah via FFM
})

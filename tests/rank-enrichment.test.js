import test from 'node:test'
import assert from 'node:assert/strict'
import { enrichRanks, tierKey } from '../api/_lib/rank-enrichment.js'
import { validateBrRank, brTierGroupFromPoints } from '../api/_lib/rank-rules.js'

test('tierKey: mapea nombre de tier a clave de color', () => {
  assert.equal(tierKey('Gran Maestro'), 'grandmaster')
  assert.equal(tierKey('Maestro de Elite'), 'master')
  assert.equal(tierKey('Maestro'), 'master')
  assert.equal(tierKey('Heroico'), 'heroic')
  assert.equal(tierKey('Diamante III'), 'diamond')
  assert.equal(tierKey('Bronce I'), 'bronze')
  assert.equal(tierKey(''), '')
})

test('rank-rules: grupo por RP y validacion BR', () => {
  assert.equal(brTierGroupFromPoints(1000), 'Bronce')
  assert.equal(brTierGroupFromPoints(2600), 'Diamante')
  assert.equal(brTierGroupFromPoints(3539), 'Heroico+') // >= 3125
  // Maestro (Heroico+) con 3539 RP => consistente => verified
  assert.equal(validateBrRank('Maestro', '3539'), 'verified')
  // Maestro con RP de Diamante => inconsistente => derived (no se afirma)
  assert.equal(validateBrRank('Maestro', '2600'), 'derived')
  assert.equal(validateBrRank('', '3539'), 'unavailable')
})

test('enrichRanks: BR verificado; CS sin secundario => estrellas unavailable', () => {
  const p = { rankBR: 'Maestro', rankBRPoints: '3539', season: '53', rankCS: 'Gran Maestro', rankCSRawValue: '142' }
  const r = enrichRanks(p)
  assert.equal(r.brRankConfidence, 'verified')
  assert.equal(r.brPointsSource, 'siambhau')
  assert.equal(r.brTierKey, 'master')
  // CS: sin proveedor secundario, NO se fabrican estrellas ni temporada.
  assert.equal(r.csStars, '')
  assert.equal(r.csSeason, '')
  assert.equal(r.csStarsConfidence, 'unavailable')
  assert.equal(r.csRankConfidence, 'derived-code')
  assert.equal(r.csTierKey, 'grandmaster')
})

test('enrichRanks: proveedor secundario VERIFICADO completa estrellas/temporada CS', () => {
  const p = { rankBR: 'Maestro', rankBRPoints: '3539', season: '53', rankCS: 'Gran Maestro' }
  const r = enrichRanks(p, { secondaryCs: { stars: 55, season: 38, source: 'proveedor-x' } })
  assert.equal(r.csStars, '55')
  assert.equal(r.csSeason, '38')
  assert.equal(r.csStarsSource, 'proveedor-x')
  assert.equal(r.csStarsConfidence, 'verified-secondary')
})

test('enrichRanks: NO usa seasonId de BR como temporada de CS', () => {
  const p = { rankBR: 'Maestro', season: '53', rankCS: 'Gran Maestro' }
  const r = enrichRanks(p) // sin secundario
  assert.notEqual(r.csSeason, '53')
  assert.equal(r.csSeason, '')
})

test('enrichRanks: perfil sin rangos => todo unavailable, sin inventar', () => {
  const r = enrichRanks({ nickname: 'X' })
  assert.equal(r.brRankConfidence, 'unavailable')
  assert.equal(r.csStars, '')
  assert.equal(r.csStarsConfidence, 'unavailable')
  assert.equal(r.brTierKey, '')
})

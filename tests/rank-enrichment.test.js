import test from 'node:test'
import assert from 'node:assert/strict'
import { enrichRanks, tierKey } from '../api/_lib/rank-enrichment.js'
import { validateBrRank, brTierGroupFromPoints, brRankFromPoints } from '../api/_lib/rank-rules.js'

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
  // Heroico (Heroico+) con 3539 RP => consistente => verified
  assert.equal(validateBrRank('Heroico', '3539'), 'verified')
  // Heroico con RP de Diamante => inconsistente => derived (no se afirma)
  assert.equal(validateBrRank('Heroico', '2600'), 'derived')
  assert.equal(validateBrRank('', '3539'), 'unavailable')
})

test('rank-rules: brRankFromPoints deriva el grupo de tier por RP', () => {
  assert.equal(brRankFromPoints(3539).name, 'Heroico') // GROUND TRUTH del juego
  assert.equal(brRankFromPoints(3539).confidence, 'verified')
  assert.equal(brRankFromPoints(1000).name, 'Bronce')
  assert.equal(brRankFromPoints(2600).name, 'Diamante')
  assert.equal(brRankFromPoints(4500).name, 'Heroico Élite') // 4300-4899 = Heroico Elite
  assert.equal(brRankFromPoints(9999).name, 'Maestro') // 6300+ = Maestro (NO "Heroico")
  assert.equal(brRankFromPoints(500).name, '') // por debajo de Bronce => sin dato
  assert.equal(brRankFromPoints('').confidence, 'unavailable')
})

test('enrichRanks: BR verificado; CS sin secundario => todo unavailable', () => {
  const p = { rankBR: 'Heroico', rankBRPoints: '3539', season: '53', rankCS: '', rankCSRawValue: '142' }
  const r = enrichRanks(p)
  assert.equal(r.brRankConfidence, 'verified')
  assert.equal(r.brPointsSource, 'siambhau')
  assert.equal(r.brTierKey, 'heroic')
  // CS: sin proveedor secundario, NO se fabrican estrellas, temporada ni tier.
  assert.equal(r.csStars, '')
  assert.equal(r.csSeason, '')
  assert.equal(r.csStarsConfidence, 'unavailable')
  assert.equal(r.csRankConfidence, 'unavailable')
  assert.equal(r.csTierKey, '')
})

test('enrichRanks: proveedor secundario VERIFICADO completa rango/estrellas/temporada CS', () => {
  const p = { rankBR: 'Heroico', rankBRPoints: '3539', season: '53', rankCS: '' }
  const r = enrichRanks(p, { secondaryCs: { stars: 55, season: 38, rank: 'Gran Maestro', source: 'proveedor-x' } })
  assert.equal(r.csStars, '55')
  assert.equal(r.csSeason, '38')
  assert.equal(r.csStarsSource, 'proveedor-x')
  assert.equal(r.csStarsConfidence, 'verified-secondary')
  assert.equal(r.csRankConfidence, 'verified-secondary')
  assert.equal(r.csTierKey, 'grandmaster')
})

test('enrichRanks: NO usa seasonId de BR como temporada de CS', () => {
  const p = { rankBR: 'Heroico', season: '53', rankCS: '' }
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

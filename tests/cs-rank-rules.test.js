import test from 'node:test'
import assert from 'node:assert/strict'
import { csTierFromCode, validateCsConsistency } from '../api/_lib/cs-rank-rules.js'

test('cs-rank-rules: ANCLA ground truth — csRank 323 = Maestro (UID 2196518104, S38)', () => {
  const t = csTierFromCode(323)
  assert.equal(t.tierKey, 'master')
  assert.equal(t.tier, 'Maestro')
  assert.equal(t.division, '')
  assert.equal(t.confidence, 'verified')
  assert.equal(t.source, 'siambhau-csrank')
})

test('cs-rank-rules: apex — 322 Heroico, 324 Gran Maestro', () => {
  assert.equal(csTierFromCode(322).tierKey, 'heroic')
  assert.equal(csTierFromCode(322).tier, 'Heroico')
  assert.equal(csTierFromCode(324).tierKey, 'grandmaster')
  assert.equal(csTierFromCode(324).tier, 'Gran Maestro')
})

test('cs-rank-rules: cross-check — csRank 315 = Platino III (control 2451868101, FFM "Platina")', () => {
  const t = csTierFromCode(315)
  assert.equal(t.tierKey, 'platinum')
  assert.equal(t.tier, 'Platino')
  assert.equal(t.division, 'III')
  assert.equal(t.confidence, 'verified')
})

test('cs-rank-rules: modelo de 4 divisiones — Diamante 318..321, Platino 314..317', () => {
  assert.equal(csTierFromCode(321).tierKey, 'diamond')
  assert.equal(csTierFromCode(321).division, 'I')
  assert.equal(csTierFromCode(318).tierKey, 'diamond')
  assert.equal(csTierFromCode(318).division, 'IV')
  assert.equal(csTierFromCode(317).tierKey, 'platinum')
  assert.equal(csTierFromCode(317).division, 'I')
  assert.equal(csTierFromCode(314).tierKey, 'platinum')
  assert.equal(csTierFromCode(314).division, 'IV')
})

test('cs-rank-rules: el ground truth SOLO encaja con 4 divisiones (con 3, 323 seria Gran Maestro)', () => {
  // 323 es Maestro (verificado). Entre Platino(315) y Maestro(323) hay 8 codigos:
  // 2 divisiones de Platino + 4 de Diamante + Heroico + Maestro => 4 divisiones/tier.
  assert.equal(csTierFromCode(323).tierKey, 'master')
  assert.notEqual(csTierFromCode(323).tierKey, 'grandmaster')
})

test('cs-rank-rules: tiers inferiores — Oro/Plata/Bronce', () => {
  assert.equal(csTierFromCode(313).tierKey, 'gold')
  assert.equal(csTierFromCode(309).tierKey, 'silver')
  assert.equal(csTierFromCode(305).tierKey, 'bronze')
  assert.equal(csTierFromCode(302).tierKey, 'bronze')
})

test('cs-rank-rules: codigo desconocido/invalido => null (no se inventa)', () => {
  assert.equal(csTierFromCode(0), null)
  assert.equal(csTierFromCode(''), null)
  assert.equal(csTierFromCode(null), null)
  assert.equal(csTierFromCode(500), null)
  assert.equal(csTierFromCode(301), null) // por debajo de Bronce IV => sin mapa
})

test('cs-rank-rules: validateCsConsistency detecta mismatch y prefiere el codigo live', () => {
  const codeTier = csTierFromCode(323) // Maestro
  const v = validateCsConsistency({ codeTier, sourceTier: 'Platina', ageDays: 28 })
  assert.equal(v.ok, false)
  assert.equal(v.conflict, 'tier-mismatch')
  assert.equal(v.codeTier, 'master')
  assert.equal(v.sourceTier, 'platinum')
  assert.equal(v.prefer, 'siambhau-csrank')
  assert.equal(v.reason, 'source-stale')
})

test('cs-rank-rules: validateCsConsistency OK cuando coinciden', () => {
  const codeTier = csTierFromCode(315) // Platino
  const v = validateCsConsistency({ codeTier, sourceTier: 'Platina', ageDays: 3 })
  assert.equal(v.ok, true)
  assert.equal(v.checked, true)
})

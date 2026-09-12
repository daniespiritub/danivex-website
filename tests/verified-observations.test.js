import test from 'node:test'
import assert from 'node:assert/strict'
import { getVerifiedObservation, verifiedSecondaryCs } from '../api/_lib/verified-observations.js'

test('verified-observations: devuelve la observacion CS verificada con provenance', () => {
  const obs = getVerifiedObservation('2196518104', 'US')
  assert.ok(obs && obs.cs)
  assert.equal(obs.cs.stars, '55')
  assert.equal(obs.cs.season, '38')
  // El TIER se almacena DIRECTAMENTE (observado in-game), no se deriva de estrellas.
  assert.equal(obs.cs.rank, 'Maestro')
  assert.equal(obs.cs.source, 'in-game-verification')
  assert.equal(obs.cs.confidence, 'verified')
  assert.equal(obs.cs.verifiedAt, '2026-09-11')
})

test('verified-observations: alias de region NA == US', () => {
  const obs = getVerifiedObservation('2196518104', 'NA')
  assert.ok(obs && obs.cs && obs.cs.stars === '55')
})

test('verified-observations: mecanismo GENERAL — UID sin registro => null (no leakage)', () => {
  assert.equal(getVerifiedObservation('999999999', 'US'), null)
  assert.equal(getVerifiedObservation('2196518104', 'BR'), null) // otra region, sin registro
  assert.equal(verifiedSecondaryCs('999999999', 'US'), null)
})

test('verified-observations: adaptador secondaryCs para enrichRanks (sin rango; se deriva luego)', () => {
  const sec = verifiedSecondaryCs('2196518104', 'US')
  assert.equal(sec.stars, '55')
  assert.equal(sec.season, '38')
  assert.equal(sec.rank, 'Maestro', 'el tier observado in-game se pasa directamente')
  assert.equal(sec.source, 'in-game-verification')
})

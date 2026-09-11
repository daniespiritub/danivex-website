import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveCsTierFromStars } from '../api/_lib/cs-rank-rules.js'

test('GROUND TRUTH CS: 55 estrellas => Maestro (NO Gran Maestro)', () => {
  const t = resolveCsTierFromStars(55)
  assert.equal(t.name, 'Maestro')
  assert.notEqual(t.name, 'Gran Maestro')
  assert.equal(t.confidence, 'verified-derived')
})

test('cs-rank-rules: Gran Maestro NUNCA se deriva de estrellas (leaderboard)', () => {
  // Estrellas muy altas siguen siendo Maestro de Elite, jamas Gran Maestro.
  assert.equal(resolveCsTierFromStars(60).name, 'Maestro de Elite')
  assert.equal(resolveCsTierFromStars(200).name, 'Maestro de Elite')
  assert.notEqual(resolveCsTierFromStars(999).name, 'Gran Maestro')
})

test('cs-rank-rules: limites de tier (monotonico)', () => {
  assert.equal(resolveCsTierFromStars(0).name, 'Bronce')
  assert.equal(resolveCsTierFromStars(39).name, 'Diamante')
  assert.equal(resolveCsTierFromStars(40).name, 'Heroico')
  assert.equal(resolveCsTierFromStars(45).name, 'Heroico')
  assert.equal(resolveCsTierFromStars(46).name, 'Heroico de Elite')
  assert.equal(resolveCsTierFromStars(51).name, 'Heroico de Elite')
  assert.equal(resolveCsTierFromStars(52).name, 'Maestro') // primera de Maestro
  assert.equal(resolveCsTierFromStars(59).name, 'Maestro') // ultima de Maestro
  assert.equal(resolveCsTierFromStars(60).name, 'Maestro de Elite')
})

test('cs-rank-rules: sin estrellas => unavailable', () => {
  assert.equal(resolveCsTierFromStars('').confidence, 'unavailable')
  assert.equal(resolveCsTierFromStars(undefined).confidence, 'unavailable')
  assert.equal(resolveCsTierFromStars(-1).confidence, 'unavailable')
})

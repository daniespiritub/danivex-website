import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRankTier, rankLabel } from '../api/_lib/ff-rank.js'

// Tabla VERIFICADA (2026-09-11): codigos 301..323 = 23 posiciones de la escalera.
test('resolveRankTier: piso y divisiones bajas', () => {
  assert.equal(rankLabel(resolveRankTier(301)), 'Bronce I') // piso real = 1000 RP
  assert.equal(rankLabel(resolveRankTier(303)), 'Bronce III')
  assert.equal(rankLabel(resolveRankTier(304)), 'Plata I')
  assert.equal(rankLabel(resolveRankTier(306)), 'Plata III')
  assert.equal(rankLabel(resolveRankTier(307)), 'Oro I')
  assert.equal(rankLabel(resolveRankTier(310)), 'Oro IV')
  assert.equal(rankLabel(resolveRankTier(311)), 'Platino I')
  assert.equal(rankLabel(resolveRankTier(314)), 'Platino IV')
  assert.equal(rankLabel(resolveRankTier(315)), 'Diamante I')
  assert.equal(rankLabel(resolveRankTier(318)), 'Diamante IV')
})

test('resolveRankTier: tiers altos (bordes criticos)', () => {
  assert.equal(rankLabel(resolveRankTier(319)), 'Heroico')
  assert.equal(rankLabel(resolveRankTier(320)), 'Heroico de Elite')
  assert.equal(rankLabel(resolveRankTier(321)), 'Maestro') // NO Gran Maestro
  assert.equal(rankLabel(resolveRankTier(322)), 'Maestro de Elite') // NO Gran Maestro
  assert.equal(rankLabel(resolveRankTier(323)), 'Gran Maestro')
})

test('resolveRankTier: Gran Maestro solo desde 323 (no 321/322)', () => {
  assert.equal(resolveRankTier(321).isGrandmaster, false)
  assert.equal(resolveRankTier(322).isGrandmaster, false)
  assert.equal(resolveRankTier(323).isGrandmaster, true)
  assert.equal(resolveRankTier(330).isGrandmaster, true) // lider real 330/62058 RP
  assert.equal(rankLabel(resolveRankTier(330)), 'Gran Maestro')
})

test('resolveRankTier: codigo desconocido => no inventa (confidence unknown)', () => {
  const r = resolveRankTier(999)
  assert.equal(r.confidence, 'unknown')
  assert.equal(rankLabel(r), '') // no muestra un tier falso
  const r2 = resolveRankTier(250) // fuera de la tabla real
  assert.equal(r2.confidence, 'unknown')
})

test('resolveRankTier: sin dato', () => {
  assert.equal(resolveRankTier(undefined).confidence, 'none')
  assert.equal(resolveRankTier('').confidence, 'none')
  assert.equal(rankLabel(resolveRankTier(null)), '')
})

test('resolveRankTier: guarda el codigo raw siempre', () => {
  assert.equal(resolveRankTier(321).code, '321')
  assert.equal(resolveRankTier(323).code, '323')
})

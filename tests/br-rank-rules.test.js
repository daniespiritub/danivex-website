import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveBrRankFromPoints } from '../api/_lib/rank-rules.js'

const r = (points, season = 53) => resolveBrRankFromPoints({ points, season })

test('br-rank: GROUND TRUTH 2196518104 — 3539 RP / S53 => Heroico I / ★1', () => {
  const x = r(3539)
  assert.equal(x.tier, 'Heroico')
  assert.equal(x.division, 'I')
  assert.equal(x.starLevel, 1)
  assert.equal(x.displayName, 'Heroico I')
  assert.equal(x.tierKey, 'heroic')
  assert.equal(x.nextThreshold, 3800)
  assert.equal(x.pointsToNext, 261) // 3800 - 3539
  assert.equal(x.confidence, 'verified')
})

test('br-rank: BOUNDARIES S53 verificados (faltan X para el proximo escalon)', () => {
  // Diamante III/IV/V (3050 / 3200 / 3350) — 3050 NO es Heroico
  assert.equal(r(3049).displayName, 'Diamante')
  assert.equal(r(3050).displayName, 'Diamante III')
  assert.equal(r(3199).displayName, 'Diamante III')
  assert.equal(r(3200).displayName, 'Diamante IV')
  assert.equal(r(3349).displayName, 'Diamante IV')
  assert.equal(r(3350).displayName, 'Diamante V')
  // Diamante V -> Heroico I en 3500 (NO 3050 ni 3125)
  assert.equal(r(3499).displayName, 'Diamante V')
  assert.equal(r(3500).displayName, 'Heroico I')
  // Heroico I -> II en 3800
  assert.equal(r(3799).displayName, 'Heroico I')
  assert.equal(r(3800).displayName, 'Heroico II')
  // Heroico II -> Heroico Elite III en 4300
  assert.equal(r(4299).displayName, 'Heroico II')
  assert.equal(r(4300).displayName, 'Heroico Élite III')
  // Elite III -> IV en 4900
  assert.equal(r(4899).displayName, 'Heroico Élite III')
  assert.equal(r(4900).displayName, 'Heroico Élite IV')
  // Elite IV -> V en 5500
  assert.equal(r(5499).displayName, 'Heroico Élite IV')
  assert.equal(r(5500).displayName, 'Heroico Élite V')
  // Elite V -> Maestro en 6300
  assert.equal(r(6299).displayName, 'Heroico Élite V')
  assert.equal(r(6300).tier, 'Maestro')
})

test('br-rank: star levels 1..5 en el grupo Heroico', () => {
  assert.equal(r(3625).starLevel, 1) // Heroico I
  assert.equal(r(3983).starLevel, 2) // Heroico II
  assert.equal(r(4434).starLevel, 3) // Elite III
  assert.equal(r(4980).starLevel, 4) // Elite IV
  assert.equal(r(5518).starLevel, 5) // Elite V
})

test('br-rank: anchors de perfiles publicos S53 => division correcta', () => {
  assert.equal(r(3625).displayName, 'Heroico I')
  assert.equal(r(3983).displayName, 'Heroico II')
  assert.equal(r(4434).displayName, 'Heroico Élite III')
  assert.equal(r(4980).displayName, 'Heroico Élite IV')
  assert.equal(r(5518).displayName, 'Heroico Élite V')
})

test('br-rank: BOUNDARY Diamante V -> Heroico I en 3500 RP (S53) — 3050 es Diamante III', () => {
  assert.equal(r(3050).tier, 'Diamante', '3050 = Diamante III, NO Heroico')
  assert.equal(r(3050).division, 'III')
  assert.equal(r(3050).starLevel, null, 'Diamante no lleva estrellas Heroicas')
  assert.equal(r(3499).displayName, 'Diamante V', 'justo antes del umbral = Diamante V')
  assert.equal(r(3500).tier, 'Heroico', 'en 3500 empieza Heroico I')
  assert.equal(r(3500).division, 'I')
  assert.equal(r(3500).starLevel, 1)
  assert.equal(r(3500).displayName, 'Heroico I')
})

test('br-rank: control 2451868101 (3291 RP) = Diamante IV, NO Heroico I', () => {
  const x = r(3291)
  assert.equal(x.tier, 'Diamante')
  assert.equal(x.division, 'IV')
  assert.equal(x.tierKey, 'diamond')
})

test('br-rank: tiers bajos = grupo sin subdivision (no se inventa)', () => {
  assert.equal(r(1000).tier, 'Bronce')
  assert.equal(r(1300).tier, 'Plata')
  assert.equal(r(1700).tier, 'Oro')
  assert.equal(r(2100).tier, 'Platino')
  assert.equal(r(2600).tier, 'Diamante')
  assert.equal(r(1000).division, '')
})

test('br-rank: acepta region/leaderboardContext sin alterar el resultado por RP', () => {
  const a = resolveBrRankFromPoints({ points: 3539, season: 53 })
  const b = resolveBrRankFromPoints({ points: 3539, season: 53, region: 'US', leaderboardContext: { top: 300 } })
  assert.equal(a.displayName, b.displayName)
  assert.equal(b.displayName, 'Heroico I')
})

test('br-rank: Maestro (6300+) = grupo (subdivisiones internas sin umbral verificado)', () => {
  assert.equal(r(6300).tier, 'Maestro')
  assert.equal(r(9999).tier, 'Maestro')
  assert.equal(r(9999).tierKey, 'master')
  assert.equal(r(9999).division, '') // no se inventa Maestro I/II/Elite sin dato
})

test('br-rank: pointsToNext / nextThreshold', () => {
  assert.equal(r(5518).nextThreshold, 6300)
  assert.equal(r(5518).pointsToNext, 782)
  assert.equal(r(6300).nextThreshold, null) // Maestro es el ultimo tramo definido
})

test('br-rank: sin RP valido => unavailable (no se inventa)', () => {
  assert.equal(r(500).tier, '')
  assert.equal(r(500).confidence, 'unavailable')
  assert.equal(r('').confidence, 'unavailable')
  assert.equal(r(null).confidence, 'unavailable')
})

test('br-rank: temporada desconocida => usa la tabla por defecto (no rompe)', () => {
  const x = resolveBrRankFromPoints({ points: 3539, season: 99 })
  assert.equal(x.displayName, 'Heroico I')
})

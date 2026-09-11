import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStats } from '../api/_lib/stats-model.js'

// Fixture con la forma REAL del endpoint /freefireinfo/stats de SiamBhau
// (verificado 2026-09-11, UID 2196518104). Datos reales de partidas.
const BR_CAREER = {
  solostats: { gamesplayed: 714, wins: 74, kills: 2004, detailedstats: { deaths: 640, damage: 600382, headshotkills: 645, highestkills: 36, headshots: 1551 } },
  duostats: { gamesplayed: 3667, wins: 572, kills: 10237, detailedstats: { deaths: 3095, damage: 4623989, headshotkills: 4176, highestkills: 35, knockdown: 10578 } },
  quadstats: { gamesplayed: 15590, wins: 3423, kills: 49926, detailedstats: { deaths: 12167, damage: 25908940, headshotkills: 14459, highestkills: 27, knockdown: 56903 } },
}
const CS_CAREER = {
  csstats: { gamesplayed: 13379, wins: 8070, kills: 56845, detailedstats: { deaths: 39251, assists: 38092, damage: 30580691, headshotkills: 20984, mvpcount: 5063, knockdowns: 63636 } },
}

test('normalizeStats: BR solo/duo/squad con metricas derivadas correctas', () => {
  const s = normalizeStats({ br: BR_CAREER, cs: CS_CAREER })
  assert.ok(s.br.solo && s.br.duo && s.br.squad, 'debe mapear los 3 modos BR')
  // Solo: 714 partidas, 74 wins, 2004 kills, 640 deaths, 600382 damage, 645 HS kills.
  assert.equal(s.br.solo.matches, 714)
  assert.equal(s.br.solo.wins, 74)
  assert.equal(s.br.solo.winRate, 10.36) // 74/714
  assert.equal(s.br.solo.kills, 2004)
  assert.equal(s.br.solo.kd, 3.13) // 2004/640
  assert.equal(s.br.solo.avgDamage, 841) // 600382/714
  assert.equal(s.br.solo.hsRate, 32.19) // 645/2004
  assert.equal(s.br.solo.highestKills, 36)
  // squad = quadstats
  assert.equal(s.br.squad.matches, 15590)
})

test('normalizeStats: CS con KDA/MVP/derribos', () => {
  const s = normalizeStats({ br: BR_CAREER, cs: CS_CAREER })
  assert.equal(s.cs.matches, 13379)
  assert.equal(s.cs.wins, 8070)
  assert.equal(s.cs.winRate, 60.32) // 8070/13379
  assert.equal(s.cs.kd, 1.45) // 56845/39251
  assert.equal(s.cs.kda, 2.42) // (56845+38092)/39251
  assert.equal(s.cs.avgDamage, 2286) // 30580691/13379
  assert.equal(s.cs.hsRate, 36.91) // 20984/56845
  assert.equal(s.cs.mvp, 5063)
  assert.equal(s.cs.knockdowns, 63636)
})

test('normalizeStats: provenance + scope carrera', () => {
  const s = normalizeStats({ br: BR_CAREER, cs: CS_CAREER })
  assert.equal(s.source, 'siambhau-stats')
  assert.equal(s.confidence, 'verified')
  assert.equal(s.scope, 'career', 'br/cs representan el scope CARRERA')
  assert.equal(s.ranked, null, 'sin datos ranked => ranked null')
  assert.ok(s.updatedAt)
})

test('GROUND TRUTH: CS RANKED coincide campo por campo con la captura del juego', () => {
  // Datos crudos REALES de SiamBhau cs/RANKED (UID 2196518104, 2026-09-11).
  const rankedCs = { csstats: { gamesplayed: 82, wins: 52, kills: 563, detailedstats: { deaths: 175, assists: 150, damage: 277945, headshotkills: 384, knockdowns: 777, mvpcount: 71 } } }
  const s = normalizeStats({ rankedBr: null, rankedCs })
  const cs = s.ranked.cs
  // Captura del juego (ground truth): 82 / 52 / 563 / KDA 4.07 / daño 3390 /
  // HS 384 / HS% 68.21 / derribos 777 / WR 63.41. TODO debe coincidir.
  assert.equal(cs.matches, 82)
  assert.equal(cs.wins, 52)
  assert.equal(cs.kills, 563)
  assert.equal(cs.kda, 4.07) // (563+150)/175
  assert.equal(cs.avgDamage, 3390) // 277945/82
  assert.equal(cs.headshotKills, 384)
  assert.equal(cs.hsRate, 68.21) // 384/563
  assert.equal(cs.knockdowns, 777)
  assert.equal(cs.winRate, 63.41) // 52/82
})

test('normalizeStats: CLASIFICATORIA (ranked) va en bloque aparte, sin mezclar', () => {
  const rankedBr = { solostats: { gamesplayed: 13, kills: 69, detailedstats: { deaths: 13, damage: 20699, headshotkills: 28, highestkills: 10 } } }
  const rankedCs = { csstats: { gamesplayed: 82, wins: 52, kills: 563, detailedstats: { deaths: 175, assists: 150, damage: 277945, headshotkills: 384, mvpcount: 71, knockdowns: 777 } } }
  const s = normalizeStats({ br: BR_CAREER, cs: CS_CAREER, rankedBr, rankedCs })
  // Carrera intacta:
  assert.equal(s.br.solo.matches, 714)
  assert.equal(s.cs.matches, 13379)
  // Clasificatoria separada:
  assert.ok(s.ranked && s.ranked.br && s.ranked.cs)
  assert.equal(s.ranked.br.solo.matches, 13)
  assert.equal(s.ranked.cs.matches, 82)
  assert.notEqual(s.ranked.cs.matches, s.cs.matches, 'ranked != carrera')
})

test('normalizeStats: modos sin partidas se omiten (NORMAL vacio)', () => {
  const empty = { solostats: { detailedstats: {} }, duostats: { detailedstats: {} }, quadstats: { detailedstats: {} } }
  const s = normalizeStats({ br: empty, cs: null })
  assert.equal(s, null, 'sin partidas ni CS => null, no se fabrica nada')
})

test('normalizeStats: solo CS disponible => br null', () => {
  const s = normalizeStats({ br: null, cs: CS_CAREER })
  assert.equal(s.br, null)
  assert.ok(s.cs)
})

test('normalizeStats: sin datos => null', () => {
  assert.equal(normalizeStats({}), null)
  assert.equal(normalizeStats(), null)
})

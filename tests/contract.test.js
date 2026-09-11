import test from 'node:test'
import assert from 'node:assert/strict'
import { mapSiamBhauProfile } from '../api/_lib/providers/siambhau.js'
import { buildResponse } from '../api/_lib/normalize.js'

/*
  CONTRACT TEST de /api/player.

  Objetivo: blindar los campos ESTABLES del perfil para que ningun cambio futuro
  (rangos, stats, nuevos proveedores) los borre accidentalmente. Si un cambio
  elimina avatar, banner, outfit, pet, Prime, clan, etc., este test FALLA.

  Usa la forma REAL de SiamBhau (UID 2196518104, verificada 2026-09-11) recorriendo
  TODO el pipeline: mapSiamBhauProfile -> buildResponse (lo que sirve /api/player).
*/

const REAL_FIXTURE = {
  basicInfo: {
    accountId: '2196518104', nickname: 'DaniPepito', level: 85, exp: 11161460,
    liked: 24400, region: 'US', rank: 321, rankingPoints: 3539, maxRank: 322,
    csRank: 323, csRankingPoints: 142, csMaxRank: 323, seasonId: 53,
    releaseVersion: 'OB54', badgeCnt: 145, bannerId: 901000008, headPic: 902033014,
    showBrRank: true, showCsRank: true, createAt: '1595100512', lastLoginAt: '1789068939',
    primeInfo: { primeLevel: 8 },
  },
  profileInfo: { avatarId: 102000004, clothes: [211000253, 203053011, 204000103, 205000133, 214053002] },
  clanBasicInfo: { clanId: '2060675720', clanName: 'PorN', clanLevel: 3, memberNum: 12 },
  captainBasicInfo: { nickname: 'ElLider' },
  petInfo: { id: 1300000091, name: 'Palomita', level: 7, skinId: 1310000097 },
  socialInfo: { signature: 'TIKTOK: MASH PRN!' },
}

function fullResponse() {
  const profile = mapSiamBhauProfile(REAL_FIXTURE)
  return buildResponse('2196518104', { ...profile, provider: 'SiamBhau' }, false)
}

test('CONTRATO: datos base presentes (nickname/uid/region/level/prime/clan)', () => {
  const r = fullResponse()
  assert.equal(r.uid, '2196518104')
  assert.equal(r.nickname, 'DaniPepito')
  assert.equal(r.region, 'US')
  assert.equal(r.level, '85')
  assert.equal(r.primeLevel, '8')
  assert.equal(r.primeConfirmed, true)
  assert.equal(r.clan, 'PorN')
  assert.equal(r.clanMembers, '12')
  assert.equal(r.clanLeader, 'ElLider')
})

test('CONTRATO: visual presente (avatar/banner/outfit/pet)', () => {
  const r = fullResponse()
  assert.ok(r.avatar, 'avatar no debe desaparecer')
  assert.ok(r.banner, 'banner no debe desaparecer')
  assert.ok(Array.isArray(r.outfit) && r.outfit.length === 5, 'outfit debe tener 5 piezas')
  assert.ok(r.outfit[0].image, 'cada pieza de outfit debe tener imagen')
  assert.equal(r.pet, 'Palomita')
  assert.equal(r.petLevel, '7')
  assert.match(r.petImage, /1310000097/, 'petImage usa la skin equipada')
  // El avatar/banner/pet/outfit se resuelven via CDN keyless (sin secreto en la URL).
  for (const url of [r.avatar, r.petImage, r.outfit[0].image]) {
    assert.ok(!/key=|FFINFO/i.test(url), 'ninguna URL debe filtrar la API key')
  }
})

test('CONTRATO: BR = Heroico por RP (ground truth), con RP y temporada', () => {
  const r = fullResponse()
  assert.equal(r.rankBR, 'Heroico', 'GROUND TRUTH: 3539 RP => Heroico (no Maestro)')
  assert.equal(r.rankBRPoints, '3539')
  assert.equal(r.season, '53')
  assert.equal(r.rankBRTierKey, 'heroic')
  assert.equal(r.rankBRConfidence, 'verified')
})

test('CONTRATO: CS sin datos falsos (sin estrellas/temporada/tier inventados)', () => {
  const r = fullResponse()
  assert.equal(r.rankCS, '', 'CS sin rango verificable en la fuente')
  assert.equal(r.rankCSStars, '', 'NUNCA mostrar 142 ni estrellas fabricadas')
  assert.notEqual(r.rankCSStars, '142')
  assert.equal(r.rankCSSeason, '', 'CS no reutiliza la temporada de BR')
  assert.notEqual(r.rankCSSeason, '53')
  assert.equal(r.rankCSRawValue, '142', 'raw conservado internamente')
  assert.equal(r.rankCSStarsConfidence, 'unavailable')
})

test('CONTRATO: stats presentes NO rompen el perfil (co-existen)', () => {
  const profile = mapSiamBhauProfile(REAL_FIXTURE)
  const withStats = { ...profile, provider: 'SiamBhau', stats: { br: { solo: { matches: 714, wins: 74, kills: 2004 } }, cs: { matches: 100 }, source: 'siambhau-stats', confidence: 'verified' } }
  const r = buildResponse('2196518104', withStats, false)
  // Stats expuestas:
  assert.ok(r.stats && r.stats.br && r.stats.br.solo, 'stats deben exponerse')
  assert.equal(r.stats.br.solo.matches, 714)
  // Y el perfil sigue intacto:
  assert.equal(r.nickname, 'DaniPepito')
  assert.ok(r.avatar && r.banner)
  assert.equal(r.outfit.length, 5)
  assert.equal(r.rankBR, 'Heroico')
})

test('CONTRATO: sin stats => stats null, perfil intacto', () => {
  const r = fullResponse()
  assert.equal(r.stats, null, 'sin stats => null, nunca objeto fabricado')
  assert.equal(r.nickname, 'DaniPepito')
})

test('CONTRATO: una mejora de rangos NO puede vaciar el perfil visual', () => {
  // Simula un perfil sin ningun dato de rango (ej: proveedor futuro) => el resto
  // del perfil (visual/base) debe seguir intacto.
  const profile = mapSiamBhauProfile({ ...REAL_FIXTURE, basicInfo: { ...REAL_FIXTURE.basicInfo, rankingPoints: 0, rank: 0, csRank: 0 } })
  const r = buildResponse('2196518104', profile, false)
  assert.equal(r.rankBR, '') // sin RP => sin rango
  // Pero lo demas NO se rompe:
  assert.equal(r.nickname, 'DaniPepito')
  assert.ok(r.avatar && r.banner)
  assert.equal(r.outfit.length, 5)
  assert.equal(r.pet, 'Palomita')
  assert.equal(r.primeLevel, '8')
})

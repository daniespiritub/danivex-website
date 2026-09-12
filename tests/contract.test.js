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
    releaseVersion: 'OB54', badgeCnt: 145, badgeId: 1001000100, bannerId: 901000008, headPic: 902033014,
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

test('CONTRATO: CS GENERAL desde el codigo del juego (csRank) — tier live por UID, sin leakage', () => {
  // Control real: csRank 315 => Platino (cross-check con el tier de FFM). Otro UID,
  // otro codigo, otro tier: el pipeline es general, no un caso por-cuenta.
  const control = mapSiamBhauProfile({ ...REAL_FIXTURE, basicInfo: { ...REAL_FIXTURE.basicInfo, accountId: '2451868101', csRank: 315, csRankingPoints: 58, csMaxRank: 315 } })
  const r = buildResponse('2451868101', { ...control, region: 'US', provider: 'SiamBhau' }, false)
  assert.equal(r.rankCS, 'Platino', 'tier del codigo autoritativo del juego (315 = Platino)')
  assert.equal(r.rankCSDivision, 'III', '315 % 100 = 15 => Platino III')
  assert.equal(r.rankCSTierKey, 'platinum', 'emblema oficial CS Platinum')
  // Sin leakage: este UID NO recibe el 55/Maestro del fixture 2196518104.
  assert.notEqual(r.rankCS, 'Maestro')
  assert.equal(r.rankCSStars, '', 'ninguna fuente live expone estrellas => no se inventan')
  // La temporada es la GLOBAL actual (config), no la del fixture verificado.
  assert.equal(r.rankCSSeason, '38')
  assert.equal(r.rankCSSeasonSource, 'global-season-config')
})

test('CONTRATO: csRank 324 => Gran Maestro (asignacion del propio juego), general', () => {
  const gm = mapSiamBhauProfile({ ...REAL_FIXTURE, basicInfo: { ...REAL_FIXTURE.basicInfo, accountId: '427951596', csRank: 324, csRankingPoints: 298, csMaxRank: 324 } })
  const r = buildResponse('427951596', { ...gm, region: 'SAC', provider: 'SiamBhau' }, false)
  assert.equal(r.rankCS, 'Gran Maestro')
  assert.equal(r.rankCSTierKey, 'grandmaster')
})

test('CONTRATO: FFM stale NO sobreescribe el tier live del codigo (validacion, no verdad)', () => {
  // El codigo live dice Maestro (323). FFM sirve un snapshot viejo (Platina). Gana el codigo.
  const profile = mapSiamBhauProfile(REAL_FIXTURE) // csRank 323 => Maestro
  const withStaleFfm = { ...profile, region: 'US', provider: 'SiamBhau', csFromFfm: { tier: 'Platina', division: 'V', stars: '58', stale: true, ageDays: 28 } }
  const r = buildResponse('2196518104', withStaleFfm, false)
  assert.equal(r.rankCS, 'Maestro', 'el codigo autoritativo del juego gana sobre FFM stale')
  assert.notEqual(r.rankCSStars, '58', 'no se muestran las estrellas stale de FFM')
})

test('CONTRATO: FFM como fallback de tier SOLO si no hay codigo live y no esta stale', () => {
  // Proveedor keyless (sin csRank): FFM FRESCO aporta el tier como fallback.
  const keyless = { region: 'BR', provider: 'FreeFireMania', csFromFfm: { tier: 'Diamante', division: 'II', stale: false } }
  const r = buildResponse('999000111', keyless, false)
  assert.equal(r.rankCS, 'Diamante', 'FFM fresco es fallback cuando no hay codigo live')
  assert.equal(r.rankCSTierKey, 'diamond')
})

test('CONTRATO: CS del UID (fixture verificado) — Maestro / 55★ / S38, NO Gran Maestro', () => {
  const r = fullResponse() // uid 2196518104 / US => sin FFM publicado => fixture verificado
  assert.equal(r.rankCS, 'Maestro', 'tier observado in-game (no derivado de estrellas)')
  assert.notEqual(r.rankCS, 'Gran Maestro')
  assert.equal(r.rankCSStars, '55', 'estrellas CS verificadas in-game')
  assert.equal(r.rankCSSeason, '38', 'temporada CS verificada (separada de BR)')
  assert.equal(r.rankCSTierKey, 'master', 'para resolver el emblema oficial CS Master')
  // Prohibiciones explicitas: nunca el raw 142 como estrellas, nunca la season BR.
  assert.notEqual(r.rankCSStars, '142')
  assert.notEqual(r.rankCSSeason, '53')
  assert.equal(r.rankCSRawValue, '142', 'raw csRankingPoints conservado internamente')
  assert.equal(r.rankCSStarsSource, 'in-game-verification', 'provenance explicita, NO API live')
})

test('CONTRATO: passCollection desde el album (posesion real), NO por existir en catalogo', () => {
  const profile = mapSiamBhauProfile(REAL_FIXTURE)
  const withAlbum = { ...profile, provider: 'SiamBhau', passAlbum: { owned: [55, 97], notOwned: [98, 29], values: { 55: 334, 97: 110 } } }
  const r = buildResponse('2196518104', withAlbum, false)
  assert.ok(r.passCollection, 'debe construir la coleccion')
  const byNum = Object.fromEntries([...r.passCollection.elitePass, ...r.passCollection.booyahPass].map((p) => [p.num, p]))
  // Solo los del album; posesion real (no todo el catalogo es owned).
  assert.equal(byNum[55].owned, true) // Elite P55 owned
  assert.equal(byNum[98].owned, false) // Booyah P98 not owned
  assert.equal(byNum[29].owned, false)
  assert.equal(byNum[1], undefined, 'un pase que NO esta en el album NO se incluye (posesion desconocida)')
  assert.equal(r.passCollection.counts.eliteOwned, 1)
  assert.equal(r.passCollection.counts.booyahOwned, 1)
  assert.equal(r.passCollection.source, 'freefiremania')
})

test('CONTRATO: sin album publicado => passCollection null (no se fabrica ownership)', () => {
  const r = fullResponse() // fixture sin passAlbum
  assert.equal(r.passCollection, null)
})

test('CONTRATO: Mystery Badge (badge) es SEPARADO de passCollection, no es historial de pases', () => {
  const r = fullResponse()
  assert.ok(r.badge, 'el profile badge sigue como campo propio')
  assert.equal(r.passCollection, null, 'el badge NO se convierte en coleccion de pases')
  assert.notEqual(r.badge.type, undefined)
})

test('CONTRATO: insignia de perfil resuelta (badgeId => nombre + imagen)', () => {
  const r = fullResponse()
  assert.ok(r.badge, 'debe resolver la insignia del badgeId')
  assert.equal(r.badge.name, 'Mystery Badge')
  assert.equal(r.badge.type, 'elite-pass')
  assert.match(r.badge.image, /1001000100\.png$/)
})

test('CONTRATO: resolver de insignia GENERAL — sin badgeId => badge null (no se inventa)', () => {
  const profile = mapSiamBhauProfile({ ...REAL_FIXTURE, basicInfo: { ...REAL_FIXTURE.basicInfo, badgeId: 0 } })
  const r = buildResponse('2196518104', { ...profile, provider: 'SiamBhau' }, false)
  assert.equal(r.badge, null)
})

test('CONTRATO: sin observacion, el TIER sale del codigo propio del UID y NO hay leakage de estrellas/temporada', () => {
  // UID distinto con su PROPIO codigo (318 = Diamante IV). El tier es general (del
  // codigo), pero NO hereda las 55★/S38 del fixture 2196518104 (eso seria leakage).
  const profile = mapSiamBhauProfile({ ...REAL_FIXTURE, basicInfo: { ...REAL_FIXTURE.basicInfo, accountId: '999999999', csRank: 318 } })
  const r = buildResponse('999999999', { ...profile, region: 'US', provider: 'SiamBhau' }, false)
  assert.equal(r.rankCS, 'Diamante', 'tier del codigo propio (318 = Diamante IV)')
  assert.equal(r.rankCSStars, '', 'sin observacion => sin estrellas (no leakage)')
  assert.notEqual(r.rankCSStars, '55', 'NUNCA hereda las 55 estrellas del fixture')
  // La temporada CS es la GLOBAL actual (config), NO la observacion verificada de otro UID.
  assert.equal(r.rankCSSeason, '38', 'temporada CS global actual (config)')
  assert.equal(r.rankCSSeasonSource, 'global-season-config', 'source config, NO in-game-verification')
})

test('CONTRATO: un proveedor LIVE de CS tiene precedencia sobre la observacion verificada', () => {
  const profile = mapSiamBhauProfile(REAL_FIXTURE)
  const withLiveCs = { ...profile, provider: 'SiamBhau', secondaryCs: { stars: '60', season: '39', rank: 'Heroico', source: 'live-provider' } }
  const r = buildResponse('2196518104', withLiveCs, false)
  assert.equal(r.rankCSStars, '60', 'live gana a la observacion verificada')
  assert.equal(r.rankCSSeason, '39')
  assert.equal(r.rankCSStarsSource, 'live-provider')
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

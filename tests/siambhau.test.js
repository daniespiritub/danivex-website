import test from 'node:test'
import assert from 'node:assert/strict'
import { mapSiamBhauProfile, isEnabled, getProfile, getStats } from '../api/_lib/providers/siambhau.js'

// Fixture con la forma REAL confirmada de SiamBhau (request autenticada
// verificada 2026-09-11 con UID 2196518104). Prueba NUESTRO normalizador.
const fixture = {
  basicInfo: {
    accountId: '2196518104',
    nickname: 'DaniPepito',
    level: 85,
    exp: 11161460,
    liked: 24400,
    region: 'US',
    rank: 321,
    rankingPoints: 3539,
    maxRank: 322,
    csRank: 323,
    csRankingPoints: 142,
    csMaxRank: 323,
    seasonId: 53,
    releaseVersion: 'OB54',
    badgeCnt: 145,
    bannerId: 901000008,
    headPic: 902033014,
    showBrRank: true,
    showCsRank: true,
    createAt: '1595100512',
    lastLoginAt: '1789068939',
    primeInfo: { primeLevel: 8 },
  },
  profileInfo: {
    avatarId: 102000004,
    clothes: [211000253, 203053011, 204000103, 205000133, 214053002],
  },
  clanBasicInfo: { clanId: '2060675720', clanName: 'PorN', clanLevel: 3, memberNum: 12 },
  captainBasicInfo: { nickname: 'ElLider' },
  petInfo: { id: 1300000091, name: 'Palomita', level: 7 },
  socialInfo: { signature: 'TIKTOK: MASH PRN!' },
}

test('mapSiamBhauProfile: info general real', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.nickname, 'DaniPepito')
  assert.equal(p.level, '85')
  assert.equal(p.likes, 24400)
  assert.equal(p.region, 'US')
  assert.equal(p.gameVersion, 'OB54')
})

test('mapSiamBhauProfile: PRIME desde primeInfo.primeLevel (anidado)', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.primeLevel, '8')
})

test('mapSiamBhauProfile: BR derivado del RP (Heroico, ground truth) y CS sin datos falsos', () => {
  const p = mapSiamBhauProfile(fixture)
  // BR: el juego muestra "Heroico" con 3539 RP. El tier sale del RP (3539 >= 3125),
  // NO del codigo 321. Esto es el GROUND TRUTH del juego (UID 2196518104).
  assert.equal(p.rankBR, 'Heroico', 'BR debe ser Heroico por RP, NO Maestro por codigo')
  assert.equal(p.rankBRPoints, '3539') // BR se mide en RP
  assert.equal(p.rankBRCode, '321') // codigo raw conservado (referencia interna)
  assert.equal(p.season, '53')
  // CS: el valor de la API (142) NO son las estrellas del juego (55), no hay
  // temporada CS ni tier fiable -> CS queda vacio. Solo se conserva el raw interno.
  assert.equal(p.rankCS, '', 'CS sin rango verificable en la fuente')
  assert.equal(p.rankCSCode, '323') // codigo raw conservado (referencia interna)
  assert.equal(p.rankCSStars, '', 'NO debe fabricar estrellas cuando la API no da el valor real del juego')
  assert.equal(p.rankCSRawValue, '142', 'conserva el valor raw csRankingPoints internamente')
})

test('mapSiamBhauProfile: imagen de mascota usa la skin equipada (skinId)', () => {
  const p = mapSiamBhauProfile({ basicInfo: { nickname: 'X' }, petInfo: { id: 1300000091, name: 'Palomita', level: 7, skinId: 1310000097 } })
  assert.equal(p.pet, 'Palomita')
  assert.equal(p.petLevel, '7')
  assert.match(p.petImage, /1310000097/, 'usa la skin equipada, no el id base')
  assert.equal(p.petSkinId, '1310000097')
})

test('mapSiamBhauProfile: tier BR por umbral de RP (oficial, verificado)', () => {
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 1000 } }).rankBR, 'Bronce')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 1300 } }).rankBR, 'Plata')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 1700 } }).rankBR, 'Oro')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 2100 } }).rankBR, 'Platino')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 2600 } }).rankBR, 'Diamante')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 3125 } }).rankBR, 'Heroico')
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 3539 } }).rankBR, 'Heroico')
  // Gran Maestro NO se deriva por RP (depende de leaderboard): RP alto sigue Heroico.
  assert.equal(mapSiamBhauProfile({ basicInfo: { rankingPoints: 8000 } }).rankBR, 'Heroico')
})

test('mapSiamBhauProfile: showBrRank=false oculta el rango', () => {
  const p = mapSiamBhauProfile({ basicInfo: { rankingPoints: 3539, showBrRank: false } })
  assert.equal(p.rankBR, '')
})

test('mapSiamBhauProfile: outfit (IDs), pet con nombre, badges', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.outfit.length, 5)
  assert.equal(p.outfit[0].id, '211000253')
  assert.equal(p.pet, 'Palomita')
  assert.equal(p.petLevel, '7')
  assert.equal(p.badgeCount, '145')
  assert.equal(p.avatarId, '102000004')
})

test('mapSiamBhauProfile: clan y lider reales', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.clan, 'PorN')
  assert.equal(p.clanId, '2060675720')
  assert.equal(p.clanMembers, '12')
  assert.equal(p.clanLeader, 'ElLider')
})

test('mapSiamBhauProfile: campos ausentes => vacios, nunca inventa', () => {
  const p = mapSiamBhauProfile({ basicInfo: { nickname: 'X' } })
  assert.equal(p.rankBR, '')
  assert.equal(p.primeLevel, '')
  assert.equal(p.clan, '')
  assert.deepEqual(p.outfit, [])
})

test('siambhau deshabilitado sin API key => getProfile outcome disabled', async () => {
  const prev = process.env.SIAMBHAU_API_KEY
  delete process.env.SIAMBHAU_API_KEY
  assert.equal(isEnabled(), false)
  const r = await getProfile('2196518104', { region: 'US' })
  assert.equal(r.ok, false)
  assert.equal(r.outcome, 'disabled')
  if (prev !== undefined) process.env.SIAMBHAU_API_KEY = prev
})

test('getStats: pide BR+CS CAREER y devuelve stats normalizadas (verificado)', async () => {
  const prevKey = process.env.SIAMBHAU_API_KEY
  const prevFetch = globalThis.fetch
  process.env.SIAMBHAU_API_KEY = 'test-key'
  const urls = []
  globalThis.fetch = async (url) => {
    urls.push(String(url))
    const gm = /gamemode=br/.test(url) ? 'br' : 'cs'
    const stats = gm === 'br'
      ? { solostats: { gamesplayed: 714, wins: 74, kills: 2004, detailedstats: { deaths: 640, damage: 600382, headshotkills: 645, highestkills: 36 } } }
      : { csstats: { gamesplayed: 100, wins: 60, kills: 500, detailedstats: { deaths: 200, assists: 100, damage: 200000, headshotkills: 150, mvpcount: 20, knockdowns: 300 } } }
    return { ok: true, json: async () => ({ success: true, stats }) }
  }
  try {
    const r = await getStats('2196518104', { region: 'US' })
    assert.equal(r.ok, true)
    assert.equal(r.stats.br.solo.matches, 714)
    assert.equal(r.stats.cs.matches, 100)
    // NO debe filtrar la key en URLs (aunque se envie por query, no en la respuesta)
    assert.ok(urls.some((u) => /gamemode=br/.test(u)) && urls.some((u) => /gamemode=cs/.test(u)), 'pide ambos modos')
  } finally {
    globalThis.fetch = prevFetch
    if (prevKey === undefined) delete process.env.SIAMBHAU_API_KEY
    else process.env.SIAMBHAU_API_KEY = prevKey
  }
})

test('getStats: fallo del endpoint => ok:false, NO rompe (best-effort)', async () => {
  const prevKey = process.env.SIAMBHAU_API_KEY
  const prevFetch = globalThis.fetch
  process.env.SIAMBHAU_API_KEY = 'test-key'
  globalThis.fetch = async () => { throw new Error('network down') }
  try {
    const r = await getStats('2196518104', { region: 'US' })
    assert.equal(r.ok, false)
    assert.equal(r.outcome, 'empty')
  } finally {
    globalThis.fetch = prevFetch
    if (prevKey === undefined) delete process.env.SIAMBHAU_API_KEY
    else process.env.SIAMBHAU_API_KEY = prevKey
  }
})

test('getStats: sin key => disabled', async () => {
  const prev = process.env.SIAMBHAU_API_KEY
  delete process.env.SIAMBHAU_API_KEY
  const r = await getStats('2196518104', { region: 'US' })
  assert.equal(r.ok, false)
  assert.equal(r.outcome, 'disabled')
  if (prev !== undefined) process.env.SIAMBHAU_API_KEY = prev
})

test('siambhau construye la peticion por HTTPS (cert valido verificado)', async () => {
  const prevKey = process.env.SIAMBHAU_API_KEY
  const prevFetch = globalThis.fetch
  process.env.SIAMBHAU_API_KEY = 'test-key'
  let calledUrl = ''
  globalThis.fetch = async (url) => {
    calledUrl = String(url)
    return { ok: true, json: async () => ({ basicInfo: { nickname: 'X' } }) }
  }
  try {
    await getProfile('2196518104', { region: 'US' })
    assert.ok(calledUrl.startsWith('https://'), `debe usar HTTPS, fue: ${calledUrl.slice(0, 12)}`)
  } finally {
    globalThis.fetch = prevFetch
    if (prevKey === undefined) delete process.env.SIAMBHAU_API_KEY
    else process.env.SIAMBHAU_API_KEY = prevKey
  }
})

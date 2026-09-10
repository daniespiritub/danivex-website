import test from 'node:test'
import assert from 'node:assert/strict'
import { mapSiamBhauProfile, isEnabled, getProfile } from '../api/_lib/providers/siambhau.js'

// Fixture con la forma ESTANDAR de AccountInfo de Free Fire (la que exponen
// SiamBhau y otras APIs de info). Prueba NUESTRO normalizador, no la API.
const fixture = {
  basicInfo: {
    accountId: '2196518104',
    nickname: 'DaniPepito',
    level: 85,
    exp: 11074588,
    liked: 24186,
    region: 'US',
    rank: 19,
    rankingPoints: 4210,
    csRank: 20,
    csRankingPoints: 5120,
    seasonId: 44,
    releaseVersion: 'OB54',
    badgeCnt: 12,
    title: 900300012,
    primeLevel: 4,
    createAt: 1594662512,
    lastLoginAt: 1786000000,
  },
  profileInfo: {
    avatarId: 102000022,
    bannerId: 901048012,
    clothes: [205000051, 211000579, 214000000],
  },
  clanBasicInfo: {
    clanId: 2060675720,
    clanName: 'PorN',
    clanLevel: 3,
    memberNum: 31,
  },
  captainBasicInfo: { nickname: 'ElLider' },
  petInfo: { id: 1300000, level: 7 },
  socialInfo: { signature: 'TIKTOK: MASH PRN!' },
}

test('mapSiamBhauProfile: extrae info general real del fixture', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.nickname, 'DaniPepito')
  assert.equal(p.level, '85')
  assert.equal(p.exp, '11074588')
  assert.equal(p.likes, 24186)
  assert.equal(p.region, 'US')
  assert.equal(p.gameVersion, 'OB54')
})

test('mapSiamBhauProfile: mapea rangos BR/CS con nombre de tier', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.rankBR, 'Heroico') // id 19
  assert.equal(p.rankBRPoints, '4210')
  assert.equal(p.rankCS, 'Gran Maestro') // id 20
  assert.equal(p.rankCSPoints, '5120')
  assert.equal(p.season, '44')
})

test('mapSiamBhauProfile: prime, title, badges, pet', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.primeLevel, '4')
  assert.equal(p.title, '900300012')
  assert.equal(p.badgeCount, '12')
  assert.equal(p.pet, '1300000')
  assert.equal(p.petLevel, '7')
})

test('mapSiamBhauProfile: outfit como lista de IDs', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.outfit.length, 3)
  assert.equal(p.outfit[0].id, '205000051')
})

test('mapSiamBhauProfile: clan y lider', () => {
  const p = mapSiamBhauProfile(fixture)
  assert.equal(p.clan, 'PorN')
  assert.equal(p.clanId, '2060675720')
  assert.equal(p.clanLevel, '3')
  assert.equal(p.clanMembers, '31')
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

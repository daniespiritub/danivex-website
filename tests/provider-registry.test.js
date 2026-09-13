import test from 'node:test'
import assert from 'node:assert/strict'
import { PROVIDER_REGISTRY, buildSources } from '../api/_lib/provider-registry.js'

test('provider-registry: SiamBhau es primary; FFM/itemData/resolvers complementan', () => {
  assert.equal(PROVIDER_REGISTRY.siambhau.integrationStatus, 'primary')
  assert.equal(PROVIDER_REGISTRY.freefiremania.integrationStatus, 'complementary')
  assert.equal(PROVIDER_REGISTRY.itemdata.integrationStatus, 'catalog')
  // Cada fuente declara su matriz de campos (capability matrix).
  for (const [name, src] of Object.entries(PROVIDER_REGISTRY)) {
    assert.ok(Array.isArray(src.fields) && src.fields.length > 0, `${name} debe declarar fields`)
    assert.ok(src.integrationStatus, `${name} debe declarar integrationStatus`)
  }
})

test('provider-registry: Mobileverso registrado como reference-only (Turnstile, sin API)', () => {
  assert.equal(PROVIDER_REGISTRY.mobileverso.integrationStatus, 'reference-only')
  assert.equal(PROVIDER_REGISTRY.mobileverso.accessType, 'turnstile-gated-html')
})

test('buildSources: procedencia por-campo de un perfil RICO (SiamBhau + resolvers)', () => {
  const ctx = {
    profile: { provider: 'SiamBhau', nickname: 'X', level: '85', likes: 24400, region: 'US', rankBR: 'Heroico', primeLevel: '8', pet: 'Falco', petNameSource: 'itemdata', passAlbum: { owned: [1] }, stats: {} },
    ranks: { csRankName: 'Maestro', csRankSource: 'siambhau-csrank' },
    primeBadge: { active: true, isVerifiedGameAsset: false },
    avatarSource: 'freefiremania', bannerSource: 'catalog', outfitLen: 5, clanClean: 'PorN',
  }
  const s = buildSources(ctx)
  assert.equal(s.nickname, 'siambhau')
  assert.match(s.rankBR, /siambhau.*danivex-resolvers/)
  assert.equal(s.rankCS, 'siambhau-csrank')
  assert.equal(s.primeLevel, 'siambhau')
  assert.equal(s.primeBadge, 'danivex-svg-fallback', 'Prime badge sin asset oficial => fallback marcado')
  assert.equal(s.pet, 'itemdata')
  assert.equal(s.passes, 'freefiremania')
  assert.equal(s.stats, 'siambhau-stats')
  assert.equal(s.avatar, 'freefiremania')
})

test('buildSources: perfil KEYLESS (sin SiamBhau) marca las fuentes correctamente', () => {
  const ctx = {
    profile: { provider: 'FreeFireMania Fast', nickname: 'Y', level: '40', likes: 0, region: 'BR', rankBR: '', primeLevel: '', pet: '', passAlbum: null, passAlbumState: 'not_published' },
    ranks: { csRankName: '' },
    primeBadge: { active: false },
    avatarSource: 'freefiremania', bannerSource: 'danivex', outfitLen: 0, clanClean: '',
  }
  const s = buildSources(ctx)
  assert.equal(s.nickname, 'keyless')
  assert.equal(s.rankBR, 'unavailable')
  assert.equal(s.primeBadge, 'none')
  assert.equal(s.pet, 'unavailable')
  assert.equal(s.passes, 'not_published', 'estado honesto de pases (no "0 pases")')
  assert.equal(s.stats, 'unavailable')
})

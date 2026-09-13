import test from 'node:test'
import assert from 'node:assert/strict'
import { PROVIDER_REGISTRY, buildSources, getEnrichmentSources, ENRICHMENT_SOURCES } from '../api/_lib/provider-registry.js'

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

test('enrichment: fuentes complementarias con URL resuelta por UID (generico, no per-UID)', () => {
  const list = getEnrichmentSources('2196518104')
  assert.ok(list.length >= 1)
  const mv = list.find((s) => s.key === 'mobileverso')
  assert.ok(mv, 'Mobileverso registrado como enrichment source')
  assert.equal(mv.accessMode, 'reference', 'reference-only (no se importa contenido)')
  assert.equal(mv.launchMode, 'popup')
  assert.equal(mv.embedAllowed, false)
  assert.match(mv.url, /mobileverso\.com\.br\/en\/freefire\/player\/2196518104$/)
  assert.ok(mv.attribution && mv.shows.length > 0)
})

test('enrichment: UID distinto => URL distinta (sin leakage; general)', () => {
  const a = getEnrichmentSources('2196518104')[0].url
  const b = getEnrichmentSources('427951596')[0].url
  assert.notEqual(a, b)
  assert.match(b, /427951596$/)
  assert.equal(getEnrichmentSources('').length, 0, 'sin uid => sin fuentes')
})

test('enrichment: ENRICHMENT_SOURCES declara accessMode valido y NO importa contenido', () => {
  for (const s of ENRICHMENT_SOURCES) {
    assert.ok(['reference', 'user_assisted'].includes(s.accessMode))
    assert.ok(typeof s.urlTemplate === 'function')
  }
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

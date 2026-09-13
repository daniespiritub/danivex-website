import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PROVIDER_REGISTRY, buildSources, getEnrichmentSources, ENRICHMENT_SOURCES,
  ACCESS_MODES, CONTENT_REUSE, MOBILEVERSO_FIELD_RIGHTS,
  classifyMobileversoField, canEnterDataMerge, getAttributionMeta, GARENA_INTEGRATION,
} from '../api/_lib/provider-registry.js'

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

test('registry depth: cada provider declara accessMode valido y fallbackPriority coherente', () => {
  for (const [name, p] of Object.entries(PROVIDER_REGISTRY)) {
    assert.ok(ACCESS_MODES.includes(p.accessMode), `${name}: accessMode debe ser valido`)
    assert.ok(CONTENT_REUSE.includes(p.contentReuseStatus), `${name}: contentReuseStatus debe ser valido`)
    assert.ok(p.technicalAccessStatus, `${name}: technicalAccessStatus requerido`)
    assert.ok(p.thirdPartyAssetStatus, `${name}: thirdPartyAssetStatus requerido`)
    // fallbackPriority: numero (>=1) o null (no entra al merge).
    assert.ok(p.fallbackPriority === null || (Number.isInteger(p.fallbackPriority) && p.fallbackPriority >= 1), `${name}: fallbackPriority`)
  }
  // SiamBhau gana el merge (prioridad mas alta); Mobileverso NO entra al merge.
  assert.equal(PROVIDER_REGISTRY.siambhau.fallbackPriority, 1)
  assert.equal(PROVIDER_REGISTRY.mobileverso.fallbackPriority, null)
  assert.equal(PROVIDER_REGISTRY.mobileverso.accessMode, 'reference_only')
})

test('rights: reference_only NO entra al merge; automatic reutilizable SI', () => {
  // Mobileverso es reference_only => jamas entra al merge de datos, campo a campo.
  assert.equal(canEnterDataMerge('mobileverso', 'bio'), false)
  assert.equal(canEnterDataMerge('mobileverso', 'passCounts'), false)
  assert.equal(canEnterDataMerge('mobileverso', 'rankEmblem'), false)
  // Fuentes automaticas reutilizables SI entran.
  assert.equal(canEnterDataMerge('siambhau', 'nickname'), true)
  assert.equal(canEnterDataMerge('itemdata', 'petSpeciesName'), true)
  // Provider inexistente => false (no leakage).
  assert.equal(canEnterDataMerge('desconocido', 'x'), false)
})

test('rights: clasificacion CAMPO POR CAMPO de Mobileverso (data vs third-party asset)', () => {
  // Datos/texto => REFERENCE_ONLY (no reutilizable sin permiso confirmado).
  assert.equal(classifyMobileversoField('bio'), 'REFERENCE_ONLY')
  assert.equal(classifyMobileversoField('passCounts'), 'REFERENCE_ONLY')
  // Assets del juego (Garena) => THIRD_PARTY_ASSET (no se rehostean automaticamente).
  assert.equal(classifyMobileversoField('rankEmblem'), 'THIRD_PARTY_ASSET')
  assert.equal(classifyMobileversoField('primeBadge'), 'THIRD_PARTY_ASSET')
  // Desconocido => conservador REFERENCE_ONLY (no inventar permisos).
  assert.equal(classifyMobileversoField('campoRaro'), 'REFERENCE_ONLY')
  // El mapa solo usa estados validos.
  for (const v of Object.values(MOBILEVERSO_FIELD_RIGHTS)) assert.ok(CONTENT_REUSE.includes(v))
})

test('attribution: dofollow (rel=noopener, SIN nofollow/sponsored/ugc) y URL del UID', () => {
  const meta = getAttributionMeta('mobileverso', '2196518104')
  assert.equal(meta.required, true)
  assert.equal(meta.type, 'dofollow')
  assert.equal(meta.rel, 'noopener')
  assert.doesNotMatch(meta.rel, /nofollow|sponsored|ugc/)
  assert.match(meta.sourceUrl, /mobileverso\.com\.br\/en\/freefire\/player\/2196518104$/)
  // Fuentes sin attributionRequired => no exigen atribucion.
  assert.equal(getAttributionMeta('siambhau', '2196518104').required, false)
})

test('enrichment: metadata de import/atribucion honesta (reference => sin "Completar perfil")', () => {
  const mv = getEnrichmentSources('2196518104')[0]
  // Reference-only HOY: sin mecanismo de import => canImport false (UI honesta).
  assert.equal(mv.importMode, null)
  assert.equal(mv.canImport, false)
  // Enlace dofollow: rel noopener, nunca nofollow/sponsored/ugc.
  assert.equal(mv.rel, 'noopener')
  assert.doesNotMatch(mv.rel, /nofollow|sponsored|ugc/)
  assert.equal(mv.attributionRequired, true)
  assert.equal(mv.attributionType, 'dofollow')
  assert.equal(mv.sourceUrl, mv.url)
})

test('garena-official: registrado como integracion PENDIENTE, fuera del merge, sin secretos', () => {
  const g = PROVIDER_REGISTRY['garena-official']
  assert.ok(g, 'garena-official registrado en el registry')
  assert.equal(g.integrationStatus, 'official-integration-pending')
  assert.equal(g.accessMode, 'unavailable')
  assert.equal(g.fallbackPriority, null)
  // Pendiente => NO entra al merge de datos todavia.
  assert.equal(canEnterDataMerge('garena-official', 'profile'), false)
  // Registro de gestion con referencia de ticket, sin secretos.
  assert.equal(GARENA_INTEGRATION.status, 'contacted-pending')
  assert.equal(GARENA_INTEGRATION.ticketId, '835889')
  const blob = JSON.stringify(GARENA_INTEGRATION).toLowerCase()
  for (const secret of ['password', 'cookie', 'token', 'authorization', 'session']) {
    assert.ok(!blob.includes(secret), `GARENA_INTEGRATION no debe contener ${secret}`)
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

/*
  Provider Capability Registry — DaniVex Player Scanner es un MULTI-SOURCE PLAYER DATA
  AGGREGATOR: cada CAMPO toma su mejor fuente y todo se fusiona en un unico perfil.

  Este modulo NO llama a las fuentes; DOCUMENTA sus capacidades/acceso/terminos y
  alimenta la procedencia por-campo (`sources`) que expone /api/player. Sirve como
  fuente unica de verdad de "que aporta cada fuente" y como punto de extension: al
  añadir un provider, se registra aqui su matriz de capacidades.

  accessType: 'api-key' | 'public-html' | 'public-json' | 'turnstile-gated-html' | 'internal'
  integrationStatus: 'primary' | 'complementary' | 'catalog' | 'internal' | 'reference-only'
*/

export const PROVIDER_REGISTRY = {
  siambhau: {
    label: 'SiamBhau',
    accessType: 'api-key',
    authRequired: true,
    regions: 'todas (via region detectada)',
    fields: ['nickname', 'level', 'likes', 'region', 'creationDate', 'lastLogin', 'rankBR:RP', 'rankCS:code', 'primeLevel', 'pet:ids', 'outfit:ids', 'clan', 'badgeId', 'stats:br/cs'],
    rateLimit: '500/dia (key free; los 429 no consumen quota)',
    freshness: 'live',
    confidence: 'verified',
    attribution: 'Fuente: SiamBhau (mostrado en la UI)',
    terms: 'key server-side; NO exponer en frontend/logs',
    integrationStatus: 'primary',
  },
  freefiremania: {
    label: 'FreeFireMania',
    accessType: 'public-html',
    authRequired: false,
    regions: 'todas (HTML publico)',
    fields: ['passAlbum:ownership', 'rankCS:tier(fallback/stale)', 'avatarUrl', 'bannerUrl', 'region:recovery', 'updatedAt:freshness'],
    freshness: 'puede estar stale (se detecta y degrada a validacion)',
    confidence: 'verified-cuando-fresco',
    terms: 'HTML publico read-only; NUNCA se evade el Turnstile del flujo UPDATE',
    integrationStatus: 'complementary',
  },
  itemdata: {
    label: 'itemData (lwprfs/freefire-player-info)',
    accessType: 'public-json',
    authRequired: false,
    fields: ['petSpeciesName', 'petSkinName', 'outfitItemNames', 'badgeName', 'passCatalogNames:Elite'],
    freshness: 'catalogo (versionado)',
    confidence: 'verified',
    terms: 'base publica de items del juego',
    integrationStatus: 'catalog',
  },
  'danivex-resolvers': {
    label: 'DaniVex resolvers',
    accessType: 'internal',
    authRequired: false,
    fields: ['rankBR:tier/division/stars(S53)', 'rankCS:tier(code map)', 'csSeason:global', 'primeBadge:SVG-fallback', 'passCatalog:Booyah-names', 'rankEmblem:oficial-self-hosted'],
    confidence: 'derived-verified',
    terms: 'logica propia + assets self-hosted (emblemas oficiales)',
    integrationStatus: 'internal',
  },
  mobileverso: {
    label: 'Mobileverso',
    accessType: 'turnstile-gated-html',
    authRequired: false,
    // Tiene datos RICOS (nombres de items+descripciones, contadores de pases Elite/Booyah
    // "X seasons played / Y purchased", emblema de rango, fechas, bio) — auditado 2026-09-13.
    fields: ['itemNames+desc', 'passCounts:elite/booyah', 'rankEmblem', 'creationDate', 'bio', 'outfit:names'],
    freshness: 'puede estar stale (ej: rango de una season anterior)',
    confidence: 'reference',
    // BLOQUEO: acceso protegido por Cloudflare Turnstile y SIN API/embed publico. Leerlo
    // server-side rodeando el Turnstile = evadir su control de acceso (prohibido). Sin
    // mecanismo oficial (API/embed/postMessage) no hay via legitima de consumirlo en el
    // backend. => referencia VISUAL manual, NO provider de datos.
    terms: 'Turnstile de acceso + sin API/embed => NO integrable server-side sin evadir el gate',
    integrationStatus: 'reference-only',
  },
}

// buildSources(ctx) -> procedencia por-campo (que fuente resolvio cada campo), para
// exponerla en /api/player. ctx trae el perfil ya resuelto + metadata de rangos/prime.
export function buildSources(ctx) {
  const { profile, ranks, primeBadge, avatarSource, bannerSource, outfitLen, clanClean } = ctx
  const rich = /siambhau/i.test(profile.provider || '')
  const base = rich ? 'siambhau' : 'keyless'
  return {
    nickname: profile.nickname ? base : 'unavailable',
    level: profile.level ? base : 'unavailable',
    likes: Number(profile.likes) ? base : base,
    region: profile.region ? base : 'unknown',
    rankBR: profile.rankBR ? 'siambhau:RP + danivex-resolvers:S53' : 'unavailable',
    rankCS: (ranks && ranks.csRankName) ? (ranks.csRankSource || 'siambhau-csrank') : 'unavailable',
    primeLevel: profile.primeLevel ? 'siambhau' : 'none/unavailable',
    primeBadge: primeBadge && primeBadge.active ? (primeBadge.isVerifiedGameAsset ? 'game-asset' : 'danivex-svg-fallback') : 'none',
    pet: profile.pet ? (profile.petNameSource || 'itemdata') : 'unavailable',
    outfit: outfitLen ? 'siambhau:ids + itemdata:names' : 'unavailable',
    clan: clanClean ? base : 'none',
    passes: profile.passAlbum ? 'freefiremania' : (profile.passAlbumState || 'unknown'),
    stats: profile.stats ? 'siambhau-stats' : 'unavailable',
    avatar: avatarSource || 'unavailable',
    banner: bannerSource || 'unavailable',
  }
}

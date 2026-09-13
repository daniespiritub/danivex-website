/*
  Provider Capability Registry — DaniVex Player Scanner es un MULTI-SOURCE PLAYER DATA
  AGGREGATOR: cada CAMPO toma su mejor fuente y todo se fusiona en un unico perfil.

  Este modulo NO llama a las fuentes; DOCUMENTA sus capacidades/acceso/terminos/derechos y
  alimenta la procedencia por-campo (`sources`) que expone /api/player. Sirve como fuente
  unica de verdad de "que aporta cada fuente, con que permisos y por que via" y como punto
  de extension: al añadir un provider, se registra aqui su matriz de capacidades.

  Tres problemas SEPARADOS por fuente (nunca se mezclan):
    1. contentReuseStatus  — ¿podemos reutilizar/republicar su contenido? (derecho)
    2. technicalAccessStatus — ¿por que via legitima accedemos? (metodo tecnico)
    3. thirdPartyAssetStatus — ¿sus assets son de terceros (Garena)? (derechos de assets)

  accessType:  'api-key' | 'public-html' | 'public-json' | 'turnstile-gated-html' | 'internal'
  accessMode:  'automatic' | 'user_assisted' | 'reference_only' | 'asset_only' | 'validation_only' | 'unavailable'
  integrationStatus: 'primary' | 'complementary' | 'catalog' | 'internal' | 'reference-only'
  fallbackPriority: 1 = mas alta (gana en el merge). null = NO entra al merge de datos.
*/

// Modos de acceso soportados. Una misma fuente puede tener distinto accessMode POR CAMPO.
export const ACCESS_MODES = ['automatic', 'user_assisted', 'reference_only', 'asset_only', 'validation_only', 'unavailable']

// Clasificacion de derechos de REUTILIZACION de contenido (independiente del acceso tecnico).
export const CONTENT_REUSE = ['REUSABLE_WITH_ATTRIBUTION', 'REFERENCE_ONLY', 'THIRD_PARTY_ASSET', 'UNKNOWN_PERMISSION', 'NOT_ALLOWED']

export const PROVIDER_REGISTRY = {
  siambhau: {
    label: 'SiamBhau',
    accessType: 'api-key',
    accessMode: 'automatic',
    authRequired: true,
    regions: 'todas (via region detectada)',
    fields: ['nickname', 'level', 'likes', 'region', 'creationDate', 'lastLogin', 'rankBR:RP', 'rankCS:code', 'primeLevel', 'pet:ids', 'outfit:ids', 'clan', 'badgeId', 'stats:br/cs'],
    rateLimit: '500/dia (key free; los 429 no consumen quota)',
    cacheTTL: 'schema v3 (lazy migration, preserve-rich)',
    freshness: 'live',
    quality: 'rich',
    confidence: 'verified',
    attributionRequired: false,
    attributionType: 'none',
    attribution: 'Fuente: SiamBhau (mostrado en la UI)',
    contentReuseStatus: 'REUSABLE_WITH_ATTRIBUTION',
    technicalAccessStatus: 'authorized-api-key',
    thirdPartyAssetStatus: 'data-only',
    terms: 'key server-side; NO exponer en frontend/logs',
    integrationStatus: 'primary',
    fallbackPriority: 1,
  },
  freefiremania: {
    label: 'FreeFireMania',
    accessType: 'public-html',
    accessMode: 'automatic',
    authRequired: false,
    regions: 'todas (HTML publico)',
    fields: ['passAlbum:ownership', 'rankCS:tier(fallback/stale)', 'avatarUrl', 'bannerUrl', 'region:recovery', 'updatedAt:freshness'],
    freshness: 'puede estar stale (se detecta y degrada a validacion)',
    quality: 'complementary',
    confidence: 'verified-cuando-fresco',
    attributionRequired: false,
    attributionType: 'none',
    contentReuseStatus: 'REFERENCE_ONLY',
    technicalAccessStatus: 'public-read',
    thirdPartyAssetStatus: 'links-third-party-assets',
    terms: 'HTML publico read-only; NUNCA se evade el Turnstile del flujo UPDATE',
    integrationStatus: 'complementary',
    fallbackPriority: 2,
  },
  itemdata: {
    label: 'itemData (lwprfs/freefire-player-info)',
    accessType: 'public-json',
    accessMode: 'automatic',
    authRequired: false,
    fields: ['petSpeciesName', 'petSkinName', 'outfitItemNames', 'badgeName', 'passCatalogNames:Elite'],
    freshness: 'catalogo (versionado)',
    quality: 'catalog',
    confidence: 'verified',
    attributionRequired: false,
    attributionType: 'none',
    contentReuseStatus: 'REUSABLE_WITH_ATTRIBUTION',
    technicalAccessStatus: 'public-read',
    thirdPartyAssetStatus: 'data-only',
    terms: 'base publica de items del juego',
    integrationStatus: 'catalog',
    fallbackPriority: 2,
  },
  'danivex-resolvers': {
    label: 'DaniVex resolvers',
    accessType: 'internal',
    accessMode: 'automatic',
    authRequired: false,
    fields: ['rankBR:tier/division/stars(S53)', 'rankCS:tier(code map)', 'csSeason:global', 'primeBadge:SVG-fallback', 'passCatalog:Booyah-names', 'rankEmblem:oficial-self-hosted'],
    freshness: 'derivado en vivo',
    quality: 'derived',
    confidence: 'derived-verified',
    attributionRequired: false,
    attributionType: 'none',
    contentReuseStatus: 'REUSABLE_WITH_ATTRIBUTION',
    technicalAccessStatus: 'internal',
    thirdPartyAssetStatus: 'self-hosted-official-emblems',
    terms: 'logica propia + assets self-hosted (emblemas oficiales)',
    integrationStatus: 'internal',
    fallbackPriority: 3,
  },
  'garena-official': {
    label: 'Garena / Free Fire (official)',
    accessType: 'partner-api',
    // PENDIENTE: solicitada una via oficial de integracion (ticket #835889, 2026-09-13).
    // Hasta que exista API/endpoint autorizado, accessMode 'unavailable' => NO entra al
    // merge. Si Garena concede acceso gratuito/autorizado, se sube a 'automatic' y toma
    // prioridad ALTA (fallbackPriority 0) para los campos que realmente exponga, SIN
    // eliminar el resto de providers.
    accessMode: 'unavailable',
    authRequired: true,
    regions: 'global/regional (por confirmar con Garena)',
    // Campos POTENCIALES si se concede (aun no disponibles):
    fields: ['profile', 'ranks:BR/CS', 'stats', 'passHistory:elite/booyah', 'primeBadge:1-8', 'assets:emblems/icons/banners'],
    freshness: 'oficial-live (si se concede)',
    quality: 'authoritative',
    confidence: 'official',
    attributionRequired: true,
    attributionType: 'per-garena-terms',
    contentReuseStatus: 'UNKNOWN_PERMISSION',
    technicalAccessStatus: 'inquiry-sent-pending', // ticket #835889 OPEN
    thirdPartyAssetStatus: 'first-party-if-granted',
    terms: 'Se solicito via oficial (developer/partner API); respetar ToS/copyright/rate-limits/attribution',
    integrationStatus: 'official-integration-pending',
    fallbackPriority: null, // no entra al merge hasta que se conceda
  },
  mobileverso: {
    label: 'Mobileverso',
    accessType: 'turnstile-gated-html',
    // Rich complementary source: sus capacidades/permisos se clasifican CAMPO POR CAMPO
    // (ver MOBILEVERSO_FIELD_RIGHTS). El acceso automatico esta bloqueado por Turnstile
    // (sin API/embed publico) => accessMode general 'reference_only' hasta que exista una
    // via legitima (embed oficial / share URL / callback / partner API).
    accessMode: 'reference_only',
    authRequired: false,
    // Datos RICOS observados (auditar con VARIAS cuentas, no una): nombres+descripciones de
    // items, contadores de pases Elite/Booyah "X played / Y purchased", emblema de rango,
    // fechas, bio, outfit con nombres, wishlist. Auditado 2026-09-13.
    fields: ['itemNames+desc', 'passCounts:elite/booyah', 'rankEmblem', 'creationDate', 'bio', 'outfit:names', 'wishlist'],
    freshness: 'puede estar stale (ej: rango de una season anterior; NO sobrescribe datos live)',
    quality: 'rich-complementary',
    confidence: 'reference',
    // ATRIBUCION: enlace dofollow al perfil del UID cuando se referencian sus datos.
    // dofollow != bypass: la atribucion y el acceso son problemas distintos y ambos deben
    // estar bien. rel='noopener' SI; nofollow/sponsored/ugc NO.
    attributionRequired: true,
    attributionType: 'dofollow',
    contentReuseStatus: 'REFERENCE_ONLY',
    // BLOQUEO tecnico: Cloudflare Turnstile + SIN API/embed publico. Leerlo server-side
    // rodeando el Turnstile = evadir su control de acceso (PROHIBIDO). Sin mecanismo oficial
    // (API/embed/postMessage/share) no hay via legitima de consumirlo en el backend.
    technicalAccessStatus: 'turnstile-gated-no-official-mechanism',
    thirdPartyAssetStatus: 'contains-third-party-game-assets',
    terms: 'Turnstile de acceso + sin API/embed => NO integrable server-side sin evadir el gate; robots Content-Signal use=reference',
    integrationStatus: 'reference-only',
    fallbackPriority: null, // NO entra al merge de datos (solo referencia visual)
  },
}

// Derechos de REUTILIZACION de Mobileverso, CAMPO POR CAMPO. No inventamos permisos ni
// descartamos los que sus terms concedan. Por defecto: sin permiso conocido => REFERENCE_ONLY.
// Los assets de juego (emblemas de rango, arte de skins/armas/personajes/prime, logos Garena)
// son de TERCEROS: THIRD_PARTY_ASSET (no se rehostean automaticamente).
export const MOBILEVERSO_FIELD_RIGHTS = {
  itemNames: 'REFERENCE_ONLY',
  itemDescriptions: 'REFERENCE_ONLY',
  passCounts: 'REFERENCE_ONLY',
  passAlbums: 'REFERENCE_ONLY',
  wishlist: 'REFERENCE_ONLY',
  bio: 'REFERENCE_ONLY',
  creationDate: 'REFERENCE_ONLY',
  lastLogin: 'REFERENCE_ONLY',
  outfitNames: 'REFERENCE_ONLY',
  stats: 'REFERENCE_ONLY',
  rankEmblem: 'THIRD_PARTY_ASSET',
  characterArt: 'THIRD_PARTY_ASSET',
  weaponArt: 'THIRD_PARTY_ASSET',
  skinArt: 'THIRD_PARTY_ASSET',
  primeBadge: 'THIRD_PARTY_ASSET',
  garenaLogo: 'THIRD_PARTY_ASSET',
}

// classifyMobileversoField(field) -> estado de reutilizacion (CONTENT_REUSE). Desconocido
// => REFERENCE_ONLY (conservador: no reutilizar contenido cuyo permiso no confirmamos).
export function classifyMobileversoField(field) {
  const key = String(field || '').trim()
  return MOBILEVERSO_FIELD_RIGHTS[key] || 'REFERENCE_ONLY'
}

// canEnterDataMerge(providerKey, field) -> ¿este valor puede FUSIONARSE en el perfil DaniVex?
// Regla de derechos (independiente del acceso tecnico):
//   - automatic + reutilizable       => SI
//   - reference_only / unavailable   => NO (solo se referencia; jamas se importa)
//   - user_assisted                  => solo tras el flujo permitido (no en el merge base)
//   - THIRD_PARTY_ASSET              => NO se rehostea automaticamente
// General: sirve para cualquier fuente futura, no solo Mobileverso.
export function canEnterDataMerge(providerKey, field) {
  const p = PROVIDER_REGISTRY[providerKey]
  if (!p) return false
  if (p.accessMode === 'reference_only' || p.accessMode === 'unavailable' || p.accessMode === 'validation_only') return false
  if (p.fallbackPriority == null) return false
  if (providerKey === 'mobileverso') {
    // Aunque hoy no entra al merge, si en el futuro se habilita user_assisted, los assets
    // de terceros siguen sin rehostearse.
    if (field && classifyMobileversoField(field) === 'THIRD_PARTY_ASSET') return false
  }
  return p.accessMode === 'automatic'
}

// getAttributionMeta(providerKey, uid) -> metadata de atribucion para la UI/provenance.
// dofollow => rel='noopener' (NUNCA nofollow/sponsored/ugc). URL especifica del UID.
export function getAttributionMeta(providerKey, uid) {
  const p = PROVIDER_REGISTRY[providerKey]
  if (!p || !p.attributionRequired) return { required: false }
  const src = ENRICHMENT_SOURCES.find((s) => s.key === providerKey)
  const cleanUid = String(uid || '').replace(/[^\d]/g, '')
  return {
    required: true,
    type: p.attributionType, // 'dofollow'
    rel: p.attributionType === 'dofollow' ? 'noopener' : 'noopener nofollow',
    label: p.label,
    sourceUrl: src && cleanUid ? src.urlTemplate(cleanUid) : '',
  }
}

// Registro de la GESTIÓN de integración oficial con Garena (solo estado, SIN secretos:
// nada de passwords/cookies/tokens/sesiones). Ver docs/integrations/garena-official-inquiry.md.
export const GARENA_INTEGRATION = {
  status: 'contacted-pending',
  contactDate: '2026-09-13',
  channel: 'Free Fire Support (EU) — ticket portal',
  channelUrl: 'https://support-freefiresg.garena.com/europe/tickets',
  ticketId: '835889',
  ticketUrl: 'https://support-freefiresg.garena.com/europe/my-tickets/835889',
  requestType: 'developer/partner/read-only player API (routed via Question/Feedback/Suggestion)',
  requestedCapabilities: ['player-profile-api', 'historical-pass-ownership', 'prime-1-8-badges', 'official-assets', 'attribution/rate-limit/region policy'],
  lastStatus: 'OPEN',
}

// Fuentes de ENRIQUECIMIENTO: complementarias que el USUARIO puede abrir para ver MÁS datos.
// El modelo es generico (registry-driven): mañana se añade otra fuente registrandola aqui,
// sin tocar la UI. Si una fuente futura ofrece captcha+callback/share/export, se marca
// accessMode 'user_assisted' + importMode, y la misma UI soporta el flujo de importacion.
//   accessMode: 'reference' (el usuario la ve; NO se importa contenido)
//               'user_assisted' (verificacion humana + resultado importable legitimo)
//   launchMode: 'popup' (ventana nueva; DaniVex sigue abierto) | 'embed' (iframe permitido)
//   importMode: null (no hay import) | 'share_url' | 'export' | 'callback' | 'api'
// Mobileverso: robots Content-Signal `use=reference` (solo referencia, ai-train=no) + Turnstile
// + sin API/embed => reference/popup, importMode=null. NO se importa su contenido. Atribucion
// dofollow (rel='noopener', sin nofollow) al perfil del UID.
export const ENRICHMENT_SOURCES = [
  {
    key: 'mobileverso',
    label: 'Mobileverso',
    accessMode: 'reference',
    launchMode: 'popup',
    embedAllowed: false, // Turnstile + Cloudflare => no framable de forma fiable
    importMode: null, // sin mecanismo legitimo de importacion HOY => solo referencia
    urlTemplate: (uid) => `https://mobileverso.com.br/en/freefire/player/${encodeURIComponent(uid)}`,
    attribution: 'Fuente complementaria: Mobileverso',
    attributionRequired: true,
    attributionType: 'dofollow',
    rel: 'noopener', // dofollow: NUNCA nofollow/sponsored/ugc
    shows: ['nombres y descripciones de items', 'contadores de pases (Elite/Booyah)', 'wishlist', 'outfit con nombres', 'emblema de rango', 'bio'],
    note: 'Puede pedir una verificación humana (captcha) de Mobileverso. Se abre su página oficial; DaniVex no importa su contenido (política use=reference).',
    requiresHumanVerification: true,
  },
]

// getEnrichmentSources(uid) -> lista de fuentes de enriquecimiento con su URL resuelta.
// El frontend muestra un boton; abre la fuente (popup/embed) con un enlace dofollow real.
// La UI decide el copy segun accessMode/importMode (honesto: sin "Completar perfil" si no
// hay import). GENERAL: no hardcodea logica a Mobileverso.
export function getEnrichmentSources(uid) {
  const cleanUid = String(uid || '').replace(/[^\d]/g, '')
  if (!cleanUid) return []
  return ENRICHMENT_SOURCES.map((s) => ({
    key: s.key,
    label: s.label,
    accessMode: s.accessMode,
    launchMode: s.launchMode,
    embedAllowed: s.embedAllowed,
    importMode: s.importMode ?? null,
    canImport: Boolean(s.importMode), // false => UI honesta "Ver datos adicionales" (no "Completar perfil")
    url: s.urlTemplate(cleanUid),
    sourceUrl: s.urlTemplate(cleanUid),
    attribution: s.attribution,
    attributionRequired: Boolean(s.attributionRequired),
    attributionType: s.attributionType || 'none',
    rel: s.rel || 'noopener', // dofollow por defecto; nunca nofollow salvo que la fuente lo exija
    shows: s.shows,
    note: s.note,
    requiresHumanVerification: Boolean(s.requiresHumanVerification),
  }))
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

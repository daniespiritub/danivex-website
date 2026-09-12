// Normalizacion comun (Player Scanner): todos los proveedores producen esta
// misma forma de respuesta, independiente de la estructura JSON del proveedor.
// Los campos ricos (rank/prime/outfit/pet/title) salen del proveedor si existen;
// si no, quedan vacios (nunca se fabrican).

import { resolveAvatar, resolveBanner } from './profile-images.js'
import { enrichRanks } from './rank-enrichment.js'
import { verifiedSecondaryCs } from './verified-observations.js'
import { resolveBadge } from './badge-resolver.js'
import { passEntry } from './pass-catalog.js'

// Construye la coleccion de pases: catalogo historico + POSESION real (del album
// publico de FreeFireMania). Solo incluye los pases que aparecen en el album (con
// posesion conocida owned/not-owned); los que FFM no publica quedan fuera (no se
// inventa ownership). null si no hay album.
function buildPassCollection(album) {
  if (!album || (!Array.isArray(album.owned) && !Array.isArray(album.notOwned))) return null
  const ownedSet = new Set(album.owned || [])
  const notOwnedSet = new Set(album.notOwned || [])
  const values = album.values || {}
  const elitePass = []
  const booyahPass = []
  let eliteOwned = 0
  let booyahOwned = 0
  // DINAMICO: el album decide QUE pases aparecen (union owned+notOwned), y passEntry
  // resuelve nombre/imagen para CUALQUIER numero (incluye P99, P100+ sin tope).
  const nums = [...new Set([...ownedSet, ...notOwnedSet])].sort((a, b) => a - b)
  for (const num of nums) {
    const p = passEntry(num)
    const owned = ownedSet.has(num)
    const entry = { num: p.num, id: p.id, system: p.system, name: p.name, image: p.image, owned, ownershipValue: values[num] ?? null }
    if (p.system === 'elite-pass') { elitePass.push(entry); if (owned) eliteOwned += 1 } else { booyahPass.push(entry); if (owned) booyahOwned += 1 }
  }
  if (!elitePass.length && !booyahPass.length) return null
  return {
    elitePass,
    booyahPass,
    counts: { eliteOwned, eliteTotal: elitePass.length, booyahOwned, booyahTotal: booyahPass.length },
    source: 'freefiremania',
    confidence: 'verified',
    updatedAt: new Date().toISOString(),
  }
}

// Placeholders de UI que algunas fuentes (FreeFireMania) filtran como "nombre"
// de clan cuando el parseo del nombre falla. No son nombres reales => se vacian.
const CLAN_PLACEHOLDERS = new Set(['registrar clan', 'register clan', 'cadastrar cla', 'cadastrar clã', 'registrar cla', 'registrar clã'])

function cleanClanName(value) {
  const v = String(value || '').trim()
  return CLAN_PLACEHOLDERS.has(v.toLowerCase()) ? '' : v
}

export function buildResponse(uid, profile, cacheHit) {
  const outfit = Array.isArray(profile.outfit) ? profile.outfit : []
  const providerLabel = profile.provider || 'FreeFireMania Fast'
  // Avatar/banner por resolvers dedicados (NO el resolver de items del outfit).
  const avatarRes = resolveAvatar(profile)
  const bannerRes = resolveBanner(profile)
  // Enriquecimiento de rangos por-campo (provenance + confidence + tier-key).
  // Precedencia CS: (1) proveedor live inyectado (profile.secondaryCs) GANA ->
  // (2) observacion in-game verificada (rellena huecos). La observacion es
  // idempotente y se aplica en cada lectura (fresh o cache) para que el resultado
  // sea consistente aunque el registro persistido no guarde todos los campos CS.
  // CS por-campo. Prioridad del TIER:
  //   (1) proveedor live inyectado (profile.secondaryCs)
  //   (2) codigo autoritativo del juego (profile.rankCS, de siambhau csRank) — GENERAL/live
  //   (3) FreeFireMania SOLO como fallback si NO hay tier live y no esta stale
  //   (4) observacion verificada in-game (fixture) — completa estrellas/temporada
  // Las ESTRELLAS/temporada CS solo vienen de la observacion verificada: ninguna
  // fuente live las expone (csRankingPoints != estrellas; FFM las sirve stale). FFM
  // es validacion/fallback, nunca source of truth. El TIER no se deriva de estrellas.
  let secondaryCs = profile.secondaryCs || null
  const ffm = profile.csFromFfm || null
  const hasLiveTier = Boolean((secondaryCs && secondaryCs.rank) || profile.rankCS)
  if (!hasLiveTier && ffm && ffm.tier && !ffm.stale) {
    secondaryCs = { rank: ffm.tier, division: ffm.division || '', source: 'freefiremania' }
  }
  const observation = verifiedSecondaryCs(uid, profile.region)
  if (observation) {
    // La observacion completa ESTRELLAS/temporada (que ninguna fuente live expone).
    // El TIER solo lo aporta si no hay ninguno (ni live inyectado, ni codigo, ni FFM).
    secondaryCs = { ...(secondaryCs || {}) }
    secondaryCs.stars = secondaryCs.stars || observation.stars
    secondaryCs.season = secondaryCs.season || observation.season
    if (!secondaryCs.rank && !profile.rankCS) secondaryCs.rank = observation.rank
    if (!secondaryCs.source) secondaryCs.source = observation.source
  }
  const ranks = enrichRanks(profile, { secondaryCs })
  const csDivision = (secondaryCs && secondaryCs.division) || profile.rankCSDivision || ''

  return {
    ok: true,
    uid,

    nickname: profile.nickname || 'Cuenta no verificada',
    username: profile.nickname || 'Cuenta no verificada',

    region: profile.region || 'SAC',
    regionCode: profile.region || 'SAC',
    regionCountry: profile.region || 'SAC',

    creationDate: profile.creationDate || '',
    lastLogin: profile.lastLogin || '',
    accountAge: profile.accountAge || '',
    verified: profile.verified,

    level: profile.level || '',
    exp: profile.exp || '',
    likes: Number(profile.likes || 0),

    gameVersion: profile.gameVersion || '',
    pass: profile.pass || '',
    booyahPass: profile.pass || '',

    clan: cleanClanName(profile.clan),
    clanId: profile.clanId || '',
    clanLevel: profile.clanLevel || '',
    clanMembers: profile.clanMembers || '',
    clanLeader: profile.clanLeader || '',

    bio: profile.bio || '',
    skinStatus: profile.skinStatus || '',
    skinError: profile.skinError || '',
    avatar: avatarRes.url,
    banner: bannerRes.url,
    bannerFallback: bannerRes.fallback || '',
    avatarSource: avatarRes.source,
    bannerSource: bannerRes.source,
    // IDs de referencia (para re-resolver dinamicamente y para snapshots):
    avatarId: profile.avatarId || '',
    headPic: profile.headPic || '',
    bannerId: profile.bannerId || '',

    emulator: profile.emulator || '',
    elitePass: profile.elitePass || '',
    season: profile.season || '',

    // Rangos enriquecidos por-campo. BR = RP (verificado); CS = ESTRELLAS (solo
    // si un proveedor secundario verificado las aporta; si no, vacio).
    rankBR: profile.rankBR || '',
    rankBRDivision: profile.rankBRDivision || '',
    rankBRPoints: profile.rankBRPoints || '',
    rankBRCode: profile.rankBRCode || '',
    rankBRSource: ranks.brRankSource,
    rankBRConfidence: ranks.brRankConfidence,
    rankBRTierKey: ranks.brTierKey,
    rankCS: profile.rankCS || ranks.csRankName || '',
    rankCSDivision: csDivision,
    rankCSStars: ranks.csStars, // solo con proveedor secundario verificado
    rankCSSeason: ranks.csSeason, // temporada CS separada de BR (si se obtiene)
    rankCSRawValue: profile.rankCSRawValue || '', // valor interno csRankingPoints (no es estrellas)
    rankCSPoints: '', // no exponer como puntos
    rankCSCode: profile.rankCSCode || '',
    rankCSSource: ranks.csRankSource,
    rankCSConfidence: ranks.csRankConfidence,
    rankCSStarsSource: ranks.csStarsSource,
    rankCSStarsConfidence: ranks.csStarsConfidence,
    rankCSTierKey: ranks.csTierKey,

    // Estadisticas REALES de partidas (BR solo/duo/squad + CS). null si el
    // proveedor de stats no las aporto (nunca se fabrican). Ver stats-model.js.
    stats: profile.stats || null,

    // Perfil visual / cosmeticos:
    title: profile.title || '',
    badgeCount: profile.badgeCount || '',
    badgeId: profile.badgeId || '',
    // Insignia / titulo de perfil resuelto (id -> nombre + imagen). null si no hay.
    badge: resolveBadge(profile.badgeId),
    // Coleccion de Pases (Elite + Booyah) con posesion real. null si no publicado.
    passCollection: buildPassCollection(profile.passAlbum),
    // Album crudo (owned/notOwned/values) — se persiste para reconstruir la
    // coleccion en lecturas cacheadas sin re-consultar FreeFireMania.
    passAlbum: profile.passAlbum || null,
    // CS crudo de FFM (tier/division/estrellas) — se persiste para reconstruir el
    // rango CS en lecturas cacheadas sin re-consultar FreeFireMania.
    csFromFfm: profile.csFromFfm || null,
    pet: profile.pet || '',
    petLevel: profile.petLevel || '',
    petImage: profile.petImage || '',
    petId: profile.petId || '',
    petSkinId: profile.petSkinId || '',
    outfit,

    provider: providerLabel,
    sourceUrl: profile.sourceUrl || '',
    cacheHit,
    savedToPrivateDb: cacheHit,

    sourceCount: 1,
    sourcesFound: [
      {
        provider: providerLabel,
        sourceUrl: profile.sourceUrl || '',
      },
    ],

    diamonds: Number(profile.diamonds || 0),
    diamondsConfirmed: Boolean(profile.diamonds),
    primeLevel: profile.primeLevel || '',
    primeConfirmed: Boolean(profile.primeLevel),
  }
}

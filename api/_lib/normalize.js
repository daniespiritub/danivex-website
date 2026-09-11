// Normalizacion comun (Player Scanner): todos los proveedores producen esta
// misma forma de respuesta, independiente de la estructura JSON del proveedor.
// Los campos ricos (rank/prime/outfit/pet/title) salen del proveedor si existen;
// si no, quedan vacios (nunca se fabrican).

import { resolveAvatar, resolveBanner } from './profile-images.js'

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
    avatarSource: avatarRes.source,
    bannerSource: bannerRes.source,
    // IDs de referencia (para re-resolver dinamicamente y para snapshots):
    avatarId: profile.avatarId || '',
    headPic: profile.headPic || '',
    bannerId: profile.bannerId || '',

    emulator: profile.emulator || '',
    elitePass: profile.elitePass || '',
    season: profile.season || '',

    // Rangos (pueblan solo con proveedor rico):
    rankBR: profile.rankBR || '',
    rankBRPoints: profile.rankBRPoints || '',
    rankCS: profile.rankCS || '',
    rankCSPoints: profile.rankCSPoints || '',

    // Perfil visual / cosmeticos:
    title: profile.title || '',
    badgeCount: profile.badgeCount || '',
    pet: profile.pet || '',
    petLevel: profile.petLevel || '',
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

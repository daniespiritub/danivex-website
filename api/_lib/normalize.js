// Normalizacion comun: todos los proveedores producen esta misma forma de
// respuesta. Movida desde free-fire-uid.js (Provider Layer), sin cambios.

export function buildResponse(uid, profile, cacheHit) {
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

    clan: profile.clan || '',
    clanId: profile.clanId || '',
    clanLevel: profile.clanLevel || '',
    clanMembers: profile.clanMembers || '',

    bio: profile.bio || '',
    skinStatus: profile.skinStatus || '',
    skinError: profile.skinError || '',
    avatar: profile.avatar || '',
    banner: profile.banner || '',

    emulator: profile.emulator || '',
    elitePass: profile.elitePass || '',
    season: profile.season || '',
    rankBR: profile.rankBR || '',
    rankCS: profile.rankCS || '',

    provider: profile.provider || 'FreeFireMania Fast',
    sourceUrl: profile.sourceUrl || '',
    cacheHit,
    savedToPrivateDb: cacheHit,

    sourceCount: 1,
    sourcesFound: [
      {
        provider: profile.provider || 'FreeFireMania Fast',
        sourceUrl: profile.sourceUrl || '',
      },
    ],

    diamonds: 0,
    diamondsConfirmed: false,
    primeLevel: '',
    primeConfirmed: false,
  }
}

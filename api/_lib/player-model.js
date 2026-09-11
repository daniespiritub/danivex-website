/*
  Normalized Data Model (Player Scanner).

  Fuente UNICA del modelo de jugador DaniVex:
   - PLAYER_DATA_FIELDS: los campos de datos del perfil.
   - MEANINGFUL_FIELDS: cuales cuentan para detectar un cambio real (hash).
   - stableProfileHash: hash estable de los campos significativos.
   - normalizeStoredPlayer: normaliza un perfil crudo (de cualquier proveedor) a
     la forma de datos que se persiste (sin metadata operativa).

  Campos ricos (rankBR/rankCS/prime/outfit/pet/title/badges) se pueblan solo si
  un proveedor los devuelve realmente (ej: SiamBhau con API key). Con la fuente
  keyless (FreeFireMania/Jornal) quedan vacios: NUNCA se fabrican.
*/

import { createHash } from 'node:crypto'

export const PLAYER_DATA_FIELDS = [
  'nickname', 'region', 'regionCode', 'regionCountry',
  'creationDate', 'lastLogin', 'accountAge',
  'level', 'exp', 'likes',
  'gameVersion', 'pass',
  'clan', 'clanId', 'clanLevel', 'clanMembers', 'clanLeader',
  'bio', 'skinStatus', 'skinError', 'avatar', 'banner',
  'avatarId', 'headPic', 'bannerId',
  'diamonds', 'primeLevel',
  // Campos ricos (rank/temporada/outfit/pet/perfil) — proveedor con key.
  // BR = RP (rankBRPoints); CS = ESTRELLAS (rankCSStars). Se guardan los codigos
  // raw (rankBRCode/rankCSCode) como identidad historica del tier.
  'rankBR', 'rankBRDivision', 'rankBRPoints', 'rankBRCode',
  'rankCS', 'rankCSDivision', 'rankCSStars', 'rankCSRawValue', 'rankCSPoints', 'rankCSCode', 'season',
  'title', 'badgeCount', 'badgeId', 'pet', 'petLevel', 'petId', 'petSkinId', 'petImage', 'outfit',
  // Estadisticas de partidas (objeto normalizado). Ver stats-model.js.
  'stats',
  // Album de posesion de pases (owned/notOwned/values). Ver ffmania-passes.js.
  'passAlbum',
]

// Significativos para el content-hash. Excluye lo volatil (lastLogin,
// accountAge, timestamps, procedencia): un tick de "ultimo acceso" no debe
// generar un snapshot nuevo. Incluye los campos ricos que si cuentan como
// cambio real (rank, prime, outfit, clan, pet).
export const MEANINGFUL_FIELDS = [
  'nickname', 'region', 'regionCode', 'level', 'exp', 'likes',
  'gameVersion', 'pass', 'clan', 'clanId', 'clanLevel', 'clanMembers',
  'bio', 'avatar', 'banner', 'headPic', 'bannerId', 'diamonds', 'primeLevel',
  'rankBR', 'rankBRCode', 'rankBRPoints', 'rankCS', 'rankCSCode', 'rankCSRawValue', 'season',
  'title', 'pet', 'petLevel', 'petSkinId', 'outfit',
]

// Serializa de forma estable un valor para el hash (arrays => JSON).
function hashValue(value) {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return JSON.stringify(value)
  return value
}

export function stableProfileHash(profile) {
  const subset = {}
  for (const key of MEANINGFUL_FIELDS) {
    subset[key] = hashValue(profile?.[key])
  }
  // Orden de insercion determinista (MEANINGFUL_FIELDS) => hash estable.
  return createHash('sha1').update(JSON.stringify(subset)).digest('hex')
}

// Normaliza a la forma de DATOS almacenada. `provider` es la procedencia. La
// metadata operativa (contentHash, observedAt, observedCount, timestamps) la
// agrega la capa de persistencia, no este modelo.
export function normalizeStoredPlayer(uid, profile) {
  return {
    uid,
    nickname: profile.nickname || '',
    region: profile.region || '',
    regionCode: profile.regionCode || '',
    regionCountry: profile.regionCountry || '',
    creationDate: profile.creationDate || null,
    lastLogin: profile.lastLogin || null,
    accountAge: profile.accountAge || '',
    level: profile.level || '',
    exp: profile.exp || '',
    likes: Number(profile.likes || 0),
    gameVersion: profile.gameVersion || '',
    pass: profile.pass || '',
    clan: profile.clan || '',
    clanId: profile.clanId || '',
    clanLevel: profile.clanLevel || '',
    clanMembers: profile.clanMembers || '',
    clanLeader: profile.clanLeader || '',
    bio: profile.bio || '',
    skinStatus: profile.skinStatus || '',
    skinError: profile.skinError || '',
    avatar: profile.avatar || '',
    banner: profile.banner || '',
    avatarId: profile.avatarId || '',
    headPic: profile.headPic || '',
    bannerId: profile.bannerId || '',
    diamonds: Number(profile.diamonds || 0),
    primeLevel: profile.primeLevel || '',
    // Ricos (vacios si el proveedor no los da). BR = RP; CS = ESTRELLAS.
    rankBR: profile.rankBR || '',
    rankBRDivision: profile.rankBRDivision || '',
    rankBRPoints: profile.rankBRPoints || '',
    rankBRCode: profile.rankBRCode || '',
    rankCS: profile.rankCS || '',
    rankCSDivision: profile.rankCSDivision || '',
    rankCSStars: profile.rankCSStars || '',
    rankCSRawValue: profile.rankCSRawValue || '',
    rankCSPoints: '',
    rankCSCode: profile.rankCSCode || '',
    season: profile.season || '',
    title: profile.title || '',
    badgeCount: profile.badgeCount || '',
    badgeId: profile.badgeId || '',
    pet: profile.pet || '',
    petLevel: profile.petLevel || '',
    petId: profile.petId || '',
    petSkinId: profile.petSkinId || '',
    petImage: profile.petImage || '',
    outfit: Array.isArray(profile.outfit) ? profile.outfit : [],
    // Estadisticas de partidas: se persisten tal cual (o null). NO entran en el
    // content-hash (MEANINGFUL_FIELDS) para no generar snapshots en cada partida.
    stats: profile.stats || null,
    // Posesion de pases (compacto: owned/notOwned/values). NO en el content-hash.
    passAlbum: profile.passAlbum || null,
    sourceUrl: profile.sourceUrl || '',
    provider: profile.provider || 'Public source',
  }
}

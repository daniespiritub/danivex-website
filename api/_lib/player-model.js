/*
  Normalized Data Model (Fase 3).

  Fuente UNICA del modelo de jugador DaniVex:
   - PLAYER_DATA_FIELDS: los campos de datos del perfil.
   - MEANINGFUL_FIELDS: cuales cuentan para detectar un cambio real (hash).
   - stableProfileHash: hash estable de los campos significativos.
   - normalizeStoredPlayer: normaliza un perfil crudo (de cualquier proveedor) a
     la forma de datos que se persiste (sin metadata operativa).

  Elimina el drift previo entre 3 mapeos dispersos. La forma es byte-compatible
  con lo que persistia saveCachedProfile (los tests de persistencia lo prueban).
*/

import { createHash } from 'node:crypto'

export const PLAYER_DATA_FIELDS = [
  'nickname', 'region', 'regionCode', 'regionCountry',
  'creationDate', 'lastLogin', 'accountAge',
  'level', 'exp', 'likes',
  'gameVersion', 'pass',
  'clan', 'clanId', 'clanLevel', 'clanMembers',
  'bio', 'skinStatus', 'skinError', 'avatar', 'banner',
  'diamonds', 'primeLevel',
]

// Significativos para el content-hash. Excluye lo volatil (lastLogin,
// accountAge, timestamps, procedencia): un tick de "ultimo acceso" no debe
// generar un snapshot nuevo.
export const MEANINGFUL_FIELDS = [
  'nickname', 'region', 'regionCode', 'level', 'exp', 'likes',
  'gameVersion', 'pass', 'clan', 'clanId', 'clanLevel', 'clanMembers',
  'bio', 'avatar', 'banner', 'diamonds', 'primeLevel',
]

export function stableProfileHash(profile) {
  const subset = {}
  for (const key of MEANINGFUL_FIELDS) {
    const value = profile?.[key]
    subset[key] = value === undefined || value === null ? '' : value
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
    bio: profile.bio || '',
    skinStatus: profile.skinStatus || '',
    skinError: profile.skinError || '',
    avatar: profile.avatar || '',
    banner: profile.banner || '',
    diamonds: Number(profile.diamonds || 0),
    primeLevel: profile.primeLevel || '',
    sourceUrl: profile.sourceUrl || '',
    provider: profile.provider || 'Public source',
  }
}

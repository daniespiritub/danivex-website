/*
  Deteccion de cambios entre dos observaciones de un jugador (Historical
  Intelligence, Fase 4). Funcion PURA y testeable.

  Solo emite eventos para campos REALMENTE almacenados y comparables. NO se
  inventan eventos de datos que no tenemos (rank/outfit/pet/wishlist no se
  persisten hoy => no se detectan).
*/

function norm(value) {
  return value === undefined || value === null ? '' : String(value)
}

function num(value) {
  return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0
}

function ev(type, field, from, to) {
  return { type, field, from: norm(from), to: norm(to) }
}

export function detectPlayerEvents(prev, next) {
  if (!prev || !next) return []

  const events = []
  const changed = (f) => norm(prev[f]) !== norm(next[f])

  if (changed('nickname')) events.push(ev('NICKNAME_CHANGED', 'nickname', prev.nickname, next.nickname))

  if (changed('level')) {
    const a = num(prev.level)
    const b = num(next.level)
    events.push(ev(b > a ? 'LEVEL_UP' : 'LEVEL_CHANGED', 'level', prev.level, next.level))
  }

  if (changed('likes')) events.push(ev('LIKES_CHANGED', 'likes', prev.likes, next.likes))

  // Gremio: cambia si cambia el ID de clan (o el nombre si no hay ID).
  const guildKey = (p) => String(p.clanId || '') || String(p.clan || '')
  if (guildKey(prev) !== guildKey(next)) events.push(ev('GUILD_CHANGED', 'clan', prev.clan, next.clan))

  if (changed('avatar')) events.push(ev('AVATAR_CHANGED', 'avatar', prev.avatar, next.avatar))
  if (changed('banner')) events.push(ev('BANNER_CHANGED', 'banner', prev.banner, next.banner))
  if (changed('bio')) events.push(ev('BIO_CHANGED', 'bio', prev.bio, next.bio))
  if (changed('primeLevel')) events.push(ev('PRIME_CHANGED', 'primeLevel', prev.primeLevel, next.primeLevel))
  if (changed('region')) events.push(ev('REGION_CHANGED', 'region', prev.region, next.region))

  // Campos ricos (solo si el proveedor los da; con la fuente keyless quedan
  // vacios y por tanto nunca disparan un evento espurio).
  // Tier BR/CS (cambio de rango: ej. Maestro -> Gran Maestro).
  if (changed('rankBR')) events.push(ev('RANK_BR_CHANGED', 'rankBR', prev.rankBR, next.rankBR))
  if (changed('rankCS')) events.push(ev('RANK_CS_CHANGED', 'rankCS', prev.rankCS, next.rankCS))
  // Metrica: BR en RP, CS en ESTRELLAS (solo si NO cambio el tier, para no
  // duplicar; el cambio de tier ya es evento propio).
  if (!changed('rankBR') && changed('rankBRPoints')) events.push(ev('RANK_BR_RP_CHANGED', 'rankBRPoints', prev.rankBRPoints, next.rankBRPoints))
  // CS: se compara el valor raw interno (rankCSRawValue), no un "estrellas"
  // fabricado. Backward-compat con snapshots viejos que usaban rankCSStars/Points.
  const csVal = (p) => norm(p.rankCSRawValue || p.rankCSStars || p.rankCSPoints)
  if (!changed('rankCS') && csVal(prev) !== csVal(next)) events.push(ev('RANK_CS_CHANGED', 'rankCS', prev.rankCS, next.rankCS))
  if (changed('title')) events.push(ev('TITLE_CHANGED', 'title', prev.title, next.title))
  if (changed('pet')) events.push(ev('PET_CHANGED', 'pet', prev.pet, next.pet))

  // Outfit: arrays; se comparan serializados.
  const outfitKey = (p) => JSON.stringify(Array.isArray(p.outfit) ? p.outfit : [])
  if (outfitKey(prev) !== outfitKey(next)) events.push(ev('OUTFIT_CHANGED', 'outfit', 'cambio', 'cambio'))

  return events
}

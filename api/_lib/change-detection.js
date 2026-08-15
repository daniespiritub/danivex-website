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

  return events
}

/*
  Modelo normalizado de ESTADISTICAS de Free Fire (Player Scanner).

  Fuente: endpoint de stats de SiamBhau (/freefireinfo/stats?gamemode=&matchmode=).
  Verificado 2026-09-11 (UID 2196518104) — datos REALES de partidas que coinciden
  con el perfil del juego. NO se inventan: si un modo no tiene partidas, se omite.

  Formas crudas:
   - BR (gamemode=br, matchmode=CAREER): { solostats, duostats, quadstats } cada uno
     { gamesplayed, wins, kills, detailedstats:{ deaths, damage, headshotkills,
       headshots, highestkills, knockdown, revives, topntimes, ... } }.
     (quadstats = escuadra de 4 = "squad").
   - CS (gamemode=cs, matchmode=CAREER): { csstats: { gamesplayed, wins, kills,
       detailedstats:{ deaths, damage, headshotkills, mvpcount, knockdowns,
       assists, doublekills, triplekills, fourkills, revivals } } }.

  Metricas derivadas (winRate, kd, avgDamage, hsRate, kda) se calculan aqui de
  forma consistente. Cada bloque lleva provenance (source/confidence/updatedAt).
*/

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
// Porcentaje con 1 decimal (0 si el divisor es 0).
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)
// Ratio con 2 decimales (si no hay muertes, se usa el nº de kills como piso).
const ratio = (a, b) => (b > 0 ? Math.round((a / b) * 100) / 100 : num(a))

// Normaliza un modo de BR (solo/duo/squad). Devuelve null si no hay partidas.
function brMode(raw) {
  if (!raw) return null
  const games = num(raw.gamesplayed)
  if (games <= 0) return null
  const d = raw.detailedstats || {}
  const kills = num(raw.kills)
  const deaths = num(d.deaths)
  const wins = num(raw.wins)
  const damage = num(d.damage)
  const headshotKills = num(d.headshotkills)
  return {
    matches: games,
    wins,
    winRate: pct(wins, games),
    kills,
    deaths,
    kd: ratio(kills, deaths),
    damage,
    avgDamage: games > 0 ? Math.round(damage / games) : 0,
    headshotKills,
    hsRate: pct(headshotKills, kills),
    highestKills: num(d.highestkills),
    knockdowns: num(d.knockdown),
  }
}

// Normaliza CS. Devuelve null si no hay partidas.
function csMode(raw) {
  if (!raw) return null
  const games = num(raw.gamesplayed)
  if (games <= 0) return null
  const d = raw.detailedstats || {}
  const kills = num(raw.kills)
  const deaths = num(d.deaths)
  const assists = num(d.assists)
  const wins = num(raw.wins)
  const damage = num(d.damage)
  const headshotKills = num(d.headshotkills)
  return {
    matches: games,
    wins,
    winRate: pct(wins, games),
    kills,
    deaths,
    assists,
    kd: ratio(kills, deaths),
    kda: ratio(kills + assists, deaths),
    damage,
    avgDamage: games > 0 ? Math.round(damage / games) : 0,
    headshotKills,
    hsRate: pct(headshotKills, kills),
    mvp: num(d.mvpcount),
    knockdowns: num(d.knockdowns),
  }
}

// normalizeStats({ br, cs }) donde br/cs son el objeto `stats` crudo del endpoint
// (br: {solostats,duostats,quadstats}; cs: {csstats}). Devuelve el modelo o null
// si no hay ningun dato util.
export function normalizeStats({ br, cs } = {}, opts = {}) {
  const brOut = {}
  if (br) {
    const solo = brMode(br.solostats)
    const duo = brMode(br.duostats)
    const squad = brMode(br.quadstats || br.squadstats)
    if (solo) brOut.solo = solo
    if (duo) brOut.duo = duo
    if (squad) brOut.squad = squad
  }
  const csOut = cs ? csMode(cs.csstats || cs) : null

  const hasBr = Object.keys(brOut).length > 0
  if (!hasBr && !csOut) return null

  return {
    br: hasBr ? brOut : null,
    cs: csOut,
    source: opts.source || 'siambhau-stats',
    confidence: 'verified',
    updatedAt: opts.updatedAt || new Date().toISOString(),
  }
}

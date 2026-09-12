/*
  Reglas oficiales de rango de Free Fire (para VALIDAR/derivar, no para inventar).

  Fuente de los umbrales BR: guia publica de rangos FF/MAX (ldplayer/sportskeeda,
  verificado 2026-09-11). Temporada/version pueden cambiar => tabla versionada y
  documentada para poder actualizarla.

  Uso: el RP del jugador es la FUENTE DE VERDAD del tier de BR (brRankFromPoints).
  El codigo de rango de la API (basicInfo.rank) NO es fiable para nombrar el tier
  (verificado: codigo 321 + 3539 RP = "Heroico", no "Maestro"). NO se deriva Gran
  Maestro por umbral de RP (GM depende de leaderboard top-300, umbral dinamico).

  Escalera (baja -> alta): Bronce, Plata, Oro, Platino, Diamante, Heroico,
  Heroico de Elite, Maestro, Maestro de Elite, Gran Maestro.
*/

export const RANK_RULES_META = {
  game: 'Free Fire / Free Fire MAX',
  source: 'Guias publicas de rangos FF + datos reales de la API',
  verifiedAt: '2026-09-11',
  note: 'Umbrales BR fiables hasta Heroico (3125). Por encima de Heroico el tier lo determina el codigo del juego, no un umbral de RP.',
}

// Umbrales de RP de Battle Royale (piso de cada grupo de tier). Verificados
// contra cuentas reales (piso Bronce I = 1000 RP) y guias publicas.
export const BR_RP_BANDS = [
  { min: 1000, tier: 'Bronce' },
  { min: 1250, tier: 'Plata' },
  { min: 1550, tier: 'Oro' },
  { min: 2038, tier: 'Platino' },
  { min: 2538, tier: 'Diamante' },
  { min: 3125, tier: 'Heroico+' }, // Heroico y superiores: el tier exacto lo da el codigo
]

// Grupo de tier esperado por RP (para BR). Devuelve el nombre de grupo o ''.
export function brTierGroupFromPoints(points) {
  const rp = Number(points)
  if (!Number.isFinite(rp) || rp <= 0) return ''
  let group = ''
  for (const band of BR_RP_BANDS) {
    if (rp >= band.min) group = band.tier
  }
  return group
}

// Tabla de rango BR por RP, VERSIONADA por temporada. Los umbrales del grupo Heroico
// (subdivisiones Heroico I/II + Heroico Elite III/IV/V) estan VERIFICADOS con perfiles
// publicos S53 via el mensaje del juego "faltan X puntos para el proximo escalon"
// (3625=>H I next 3800; 3983=>H II next 4300; 4434=>HE III next 4900; 4980=>HE IV next
// 5500; 5518=>HE V next 6300). Maestro empieza en 6300 (verificado). Las subdivisiones
// INTERNAS de Maestro/Maestro Elite y Gran Maestro NO tienen umbral publico verificable
// (GM = leaderboard top ~300, dinamico) => se muestra el grupo "Maestro" sin inventar
// division. Para actualizar en S54: anadir otra entrada a BR_RANK_RULES_BY_SEASON.
const S53_BANDS = [
  { min: 1000, tier: 'Bronce', tierKey: 'bronze' },
  { min: 1250, tier: 'Plata', tierKey: 'silver' },
  { min: 1550, tier: 'Oro', tierKey: 'gold' },
  { min: 2038, tier: 'Platino', tierKey: 'platinum' },
  { min: 2538, tier: 'Diamante', tierKey: 'diamond' },
  { min: 3125, tier: 'Heroico', division: 'I', starLevel: 1, tierKey: 'heroic' },
  { min: 3800, tier: 'Heroico', division: 'II', starLevel: 2, tierKey: 'heroic' },
  { min: 4300, tier: 'Heroico Élite', division: 'III', starLevel: 3, tierKey: 'heroic' },
  { min: 4900, tier: 'Heroico Élite', division: 'IV', starLevel: 4, tierKey: 'heroic' },
  { min: 5500, tier: 'Heroico Élite', division: 'V', starLevel: 5, tierKey: 'heroic' },
  { min: 6300, tier: 'Maestro', tierKey: 'master' },
]

export const BR_RANK_RULES_BY_SEASON = {
  53: { season: '53', source: 'perfiles publicos S53 (mensaje "faltan X para el proximo escalon")', verifiedAt: '2026-09-12', bands: S53_BANDS },
}
const DEFAULT_BR_SEASON = 53

function brRulesForSeason(season) {
  const key = Number(season)
  return BR_RANK_RULES_BY_SEASON[key] || BR_RANK_RULES_BY_SEASON[DEFAULT_BR_SEASON]
}

// resolveBrRankFromPoints({points, season, region}) — resolver GENERAL por RP (fuente
// de verdad). Devuelve tier + division + starLevel + displayName + emblema + progreso
// al siguiente escalon + provenance. NO inventa: Gran Maestro es leaderboard (no por
// RP) y las subdivisiones de Maestro no tienen umbral publico => grupo "Maestro".
export function resolveBrRankFromPoints({ points, season } = {}) {
  const rp = Number(points)
  const rules = brRulesForSeason(season)
  if (!Number.isFinite(rp) || rp < 1000) {
    return { tier: '', division: '', starLevel: null, displayName: '', tierKey: '', points: Number.isFinite(rp) ? rp : null, nextThreshold: null, pointsToNext: null, season: String(season || ''), source: rules.source, confidence: 'unavailable' }
  }
  const bands = rules.bands
  let idx = 0
  for (let i = 0; i < bands.length; i += 1) if (rp >= bands[i].min) idx = i
  const b = bands[idx]
  const next = bands[idx + 1]
  const division = b.division || ''
  return {
    tier: b.tier,
    division,
    starLevel: b.starLevel || null,
    displayName: division ? `${b.tier} ${division}` : b.tier,
    tierKey: b.tierKey,
    points: rp,
    nextThreshold: next ? next.min : null,
    pointsToNext: next ? Math.max(0, next.min - rp) : null,
    season: String(season || rules.season || ''),
    source: rules.source,
    confidence: 'verified',
  }
}

// Compat: nombre de GRUPO de tier + confidence (usado por el enriquecimiento/validacion).
// Ahora distingue el grupo real por RP (Heroico vs Heroico Elite vs Maestro), no todo
// "Heroico". El detalle (division/estrellas/progreso) lo da resolveBrRankFromPoints.
export function brRankFromPoints(points, season) {
  const r = resolveBrRankFromPoints({ points, season })
  return { name: r.tier, confidence: r.confidence }
}

// Grupo base de un nombre de tier (para comparar con el grupo por RP).
function tierGroupOf(name) {
  if (!name) return ''
  if (/gran maestro|maestro|heroico/i.test(name)) return 'Heroico+' // Heroico y arriba
  if (/diamante/i.test(name)) return 'Diamante'
  if (/platino/i.test(name)) return 'Platino'
  if (/oro/i.test(name)) return 'Oro'
  if (/plata/i.test(name)) return 'Plata'
  if (/bronce/i.test(name)) return 'Bronce'
  return ''
}

// Cross-valida el tier BR (derivado del codigo) contra los RP reales.
// -> 'verified'  : el grupo por RP coincide con el grupo del tier del codigo.
// -> 'derived'   : hay tier del codigo pero no se pudo confirmar con RP.
// -> 'unavailable': sin datos.
export function validateBrRank(rankName, points) {
  if (!rankName) return 'unavailable'
  const byPoints = brTierGroupFromPoints(points)
  if (!byPoints) return 'derived'
  return byPoints === tierGroupOf(rankName) ? 'verified' : 'derived'
}

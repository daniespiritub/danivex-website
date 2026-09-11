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

// FUENTE DE VERDAD del tier de BR: el RP del jugador (verificado contra el juego,
// UID 2196518104: 3539 RP => "Heroico", NO "Maestro"). El CODIGO de rango de la
// API (basicInfo.rank) NO es fiable para nombrar el tier, por eso se usa el RP.
//
// Heroico (3125+) es el tier mas alto VERIFICABLE por RP. Gran Maestro es un tier
// de leaderboard (top ~300 por region, umbral dinamico diario) => NO se deriva por
// RP ni por codigo sin evidencia. Un jugador Gran Maestro real se muestra como
// "Heroico" (honesto) en vez de arriesgar un nombre superior sin poder verificarlo.
// Tampoco se afirman subdivisiones (Bronce I/II/III): los umbrales por division no
// estan documentados de forma fiable, asi que se muestra solo el grupo de tier.
export function brRankFromPoints(points) {
  const rp = Number(points)
  if (!Number.isFinite(rp) || rp < 1000) return { name: '', confidence: 'unavailable' }
  let name = ''
  for (const band of BR_RP_BANDS) {
    if (rp >= band.min) name = band.tier
  }
  if (name === 'Heroico+') name = 'Heroico'
  return { name, confidence: name ? 'verified' : 'unavailable' }
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

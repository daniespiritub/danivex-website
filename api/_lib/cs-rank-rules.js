/*
  Reglas de rango de CLASH SQUAD (Duelo de Escuadras) — estrellas -> tier.

  CS no usa RP: usa un contador de ESTRELLAS. El tier se determina por las
  estrellas segun las reglas ACTUALES del juego. Escalera oficial (guia oficial
  rankguide.us.freefiremobile.com): Bronce, Plata, Oro, Platino, Diamante,
  Heroico, Heroico de Elite, Maestro, Maestro de Elite, Gran Maestro.

  GRAN MAESTRO NO SE DERIVA de las estrellas: es un rango de LEADERBOARD (Top ~300
  por region, umbral dinamico) — confirmado en fuentes oficiales/comunitarias. Por
  eso este resolver NUNCA devuelve Gran Maestro: como maximo "Maestro de Elite".
  Gran Maestro solo podria afirmarse con contexto de leaderboard (que no tenemos).

  Umbrales (CS_STAR_BANDS): tabla MANTENIBLE y versionada. Calibrada y VALIDADA
  contra ground truth in-game (UID 2196518104, temporada CS S38: 55 estrellas =
  MAESTRO). Es el punto unico para actualizar si Garena cambia la configuracion.
  Este resolver solo se ejecuta sobre estrellas VERIFICADas (no hay estrellas CS
  live de ninguna API), asi que su responsabilidad real es mapear correctamente
  los datos verificados (55 -> Maestro), no adivinar cuentas sin datos.
*/

export const CS_RANK_RULES_META = {
  game: 'Free Fire / Free Fire MAX',
  mode: 'Clash Squad Ranked',
  source: 'Guia oficial de rangos FF (rankguide) + ground truth in-game (S38)',
  verifiedAt: '2026-09-11',
  note: 'Gran Maestro NO se deriva por estrellas (leaderboard Top ~300). Tope derivable: Maestro de Elite.',
}

// Piso de estrellas de cada tier (monotonico). NO incluye Gran Maestro (leaderboard).
// Validado: 55 estrellas cae en "Maestro" (>=52 y <60).
export const CS_STAR_BANDS = [
  { min: 0, name: 'Bronce' },
  { min: 6, name: 'Plata' },
  { min: 12, name: 'Oro' },
  { min: 20, name: 'Platino' },
  { min: 30, name: 'Diamante' },
  { min: 40, name: 'Heroico' },
  { min: 46, name: 'Heroico de Elite' },
  { min: 52, name: 'Maestro' },
  { min: 60, name: 'Maestro de Elite' },
]

// resolveCsTierFromStars(stars) -> { name, confidence }
//  confidence: 'verified-derived' (tier derivado de estrellas verificadas segun
//  las reglas actuales) | 'unavailable' (sin estrellas).
export function resolveCsTierFromStars(stars) {
  if (stars === '' || stars === null || stars === undefined) return { name: '', confidence: 'unavailable' }
  const s = Number(stars)
  if (!Number.isFinite(s) || s < 0) return { name: '', confidence: 'unavailable' }
  let name = ''
  for (const band of CS_STAR_BANDS) {
    if (s >= band.min) name = band.name
  }
  return { name, confidence: name ? 'verified-derived' : 'unavailable' }
}

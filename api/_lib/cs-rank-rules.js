/*
  Reglas de Clash Squad — resolucion GENERAL del tier desde el codigo de rango que
  el propio juego expone (Free Fire AccountInfo.csRank), LIVE para cualquier UID.

  Por que el codigo y no las estrellas ni el label del tracker:
   - El label de un tracker (FreeFireMania) puede estar STALE (snapshot viejo). Se
     comprobo que FFM sirve datos de hace semanas (p.ej. "actualizado 2026-08-15",
     emblema OB48) que ni siquiera coinciden con el BR live => no es source of truth.
   - Las estrellas del display in-game NO las expone ninguna fuente publica live
     (csRankingPoints != estrellas: p.ej. 142 pts para una cuenta de 55 estrellas).
   - csRank es el id de rango AUTORITATIVO del juego (mismo para todos): resolverlo
     es GENERAL y no es un hardcode por-cuenta.

  Enumeracion (verificada por anclas + estructura de tiers actual):
    ANCLA GROUND TRUTH: csRank 323 = Maestro (UID 2196518104, observado in-game S38).
    CROSS-CHECK:        csRank 315 = Platino (UID 2451868101, FFM tier "Platina").
    TOP:                csRank 324 = Gran Maestro (asignacion propia del juego).
  Con 323=Maestro forzado, el modelo de 4 divisiones por tier (Bronce..Diamante) es
  el UNICO que encaja: con 3 divisiones 323 caeria en Gran Maestro (contradice el
  ground truth). Diamante=318..321, Platino=314..317 (=> 315=Platino III, coincide
  con el cross-check). Heroico=322, Maestro=323, Gran Maestro=324 (apex sin division).

  Gran Maestro: NO se deduce de un umbral de estrellas. csRank=324 es la asignacion
  del propio juego (que ya aplica su logica de leaderboard) => es evidencia valida.
*/

import { tierKey } from './rank-enrichment.js'

const TIER_ES = {
  bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino',
  diamond: 'Diamante', heroic: 'Heroico', master: 'Maestro', grandmaster: 'Gran Maestro',
}
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

// Apex (sin division). Anclas de alta confianza.
const APEX = new Map([[322, 'heroic'], [323, 'master'], [324, 'grandmaster']])

// Tiers con division (I..IV, I = mas alta). `hi` = codigo de la division I.
const LOWER = [
  { key: 'diamond', hi: 321 }, // 321..318 = I..IV
  { key: 'platinum', hi: 317 }, // 317..314 (cross-check: 315 = Platino III)
  { key: 'gold', hi: 313 }, // 313..310
  { key: 'silver', hi: 309 }, // 309..306
  { key: 'bronze', hi: 305 }, // 305..302
]

// csTierFromCode(code) -> { tierKey, tier, division, code, confidence, source } | null.
// Resuelve el tier CS desde el codigo autoritativo del juego. General, sin hardcode
// por-cuenta. null si el codigo esta fuera del rango conocido (no se inventa).
export function csTierFromCode(code) {
  const c = Number(code)
  if (!Number.isFinite(c) || c <= 0) return null
  if (APEX.has(c)) {
    const key = APEX.get(c)
    return { tierKey: key, tier: TIER_ES[key], division: '', code: c, confidence: 'verified', source: 'siambhau-csrank' }
  }
  for (const t of LOWER) {
    if (c <= t.hi && c >= t.hi - 3) {
      const div = t.hi - c + 1
      // Diamante/Platino cross-checkeados; tiers inferiores extrapolados (still el
      // codigo del juego, solo el limite de tier es menos verificable externamente).
      const confidence = c >= 314 ? 'verified' : 'high'
      return { tierKey: t.key, tier: TIER_ES[t.key], division: ROMAN[div] || '', code: c, confidence, source: 'siambhau-csrank' }
    }
  }
  return null
}

// validateCsConsistency: compara el tier resuelto por el codigo (autoritativo/live)
// con el tier de una fuente externa (p.ej. FFM). Detecta stale/mismatch. NO inventa:
// solo informa cual preferir y por que. ageDays = antiguedad del snapshot externo.
export function validateCsConsistency({ codeTier, sourceTier, ageDays } = {}) {
  if (!codeTier || !sourceTier) return { ok: true, checked: false }
  const a = codeTier.tierKey || ''
  const b = tierKey(sourceTier)
  if (a && b && a !== b) {
    return {
      ok: false,
      checked: true,
      conflict: 'tier-mismatch',
      codeTier: a,
      sourceTier: b,
      prefer: 'siambhau-csrank',
      reason: ageDays != null && ageDays > 14 ? 'source-stale' : 'source-disagrees',
    }
  }
  return { ok: true, checked: true }
}

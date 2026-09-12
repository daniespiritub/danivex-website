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

  Enumeracion por TIER-INDEX (robusta a temporada). El codigo csRank del juego tiene
  la forma  block*100 + tierIndex  (el block/centena es un contador de version/season
  que cambia con el tiempo; los DOS ultimos digitos son el tier+division). Por eso el
  mapeo se hace sobre  code % 100 :
    tierIndex 24 = Gran Maestro   tierIndex 23 = Maestro   tierIndex 22 = Heroico
    18..21 = Diamante (I..IV)     14..17 = Platino (I..IV)  10..13 = Oro
     6..9  = Plata                 2..5  = Bronce           0/1 = sin rango
  Anclas (multiples, distinto block => confirma el modulo-100):
    323 (%100=23) = Maestro       -> GROUND TRUTH (UID 2196518104, S38, in-game).
    315 (%100=15) = Platino III   -> cross-check (control 2451868101, FFM "Platina").
    324 (%100=24) = Gran Maestro  -> asignacion del propio juego (UID 427951596).
    219 (%100=19) = Diamante III  -> otra API publica (jinix6), block distinto (2xx).
  Con 23=Maestro forzado, el modelo de 4 divisiones (Bronce..Diamante) es el UNICO que
  encaja (con 3, 23 caeria en Gran Maestro). Gran Maestro NO se deduce de estrellas:
  tierIndex 24 es la asignacion del propio juego (que ya aplica su logica de leaderboard).
*/

import { tierKey } from './rank-enrichment.js'

// Temporada CS ACTUAL (global). La temporada de Clash Squad es un contador global
// (igual para todas las cuentas en un periodo dado) y NO la expone el AccountInfo por
// cuenta (seasonId es de BR). Se resuelve desde esta config global actualizable, con
// procedencia explicita. Verificado in-game el 2026-09-11 (UID 2196518104 => S38).
// Override con env CS_CURRENT_SEASON si cambia sin desplegar. NUNCA se usa el seasonId
// de BR como temporada CS.
export const CURRENT_CS_SEASON = {
  value: process.env.CS_CURRENT_SEASON || '38',
  source: 'global-season-config',
  since: '2026-09',
  confidence: 'config',
}

const TIER_ES = {
  bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino',
  diamond: 'Diamante', heroic: 'Heroico', master: 'Maestro', grandmaster: 'Gran Maestro',
}
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

// Apex (sin division), por tier-index.
const APEX = new Map([[22, 'heroic'], [23, 'master'], [24, 'grandmaster']])

// Tiers con division (I..IV, I = mas alta). `hi` = tier-index de la division I.
const LOWER = [
  { key: 'diamond', hi: 21 }, // 21..18 = I..IV
  { key: 'platinum', hi: 17 }, // 17..14 (cross-check: idx 15 = Platino III)
  { key: 'gold', hi: 13 }, // 13..10
  { key: 'silver', hi: 9 }, // 9..6
  { key: 'bronze', hi: 5 }, // 5..2
]

// csTierFromCode(code) -> { tierKey, tier, division, code, tierIndex, confidence, source } | null.
// Resuelve el tier CS desde el codigo autoritativo del juego (general, sin hardcode
// por-cuenta, robusto a temporada via modulo-100). null si esta fuera del rango
// conocido (no se inventa).
export function csTierFromCode(code) {
  const c = Number(code)
  if (!Number.isFinite(c) || c <= 0) return null
  const idx = c >= 100 ? c % 100 : c // block*100 + tierIndex => tier-index
  if (idx <= 1) return null // 0/1 = sin rango
  if (APEX.has(idx)) {
    const key = APEX.get(idx)
    return { tierKey: key, tier: TIER_ES[key], division: '', code: c, tierIndex: idx, confidence: 'verified', source: 'siambhau-csrank' }
  }
  for (const t of LOWER) {
    if (idx <= t.hi && idx >= t.hi - 3) {
      const div = t.hi - idx + 1
      // Diamante/Platino cross-checkeados; tiers inferiores extrapolados (still el
      // codigo del juego, solo el limite de tier es menos verificable externamente).
      const confidence = idx >= 14 ? 'verified' : 'high'
      return { tierKey: t.key, tier: TIER_ES[t.key], division: ROMAN[div] || '', code: c, tierIndex: idx, confidence, source: 'siambhau-csrank' }
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

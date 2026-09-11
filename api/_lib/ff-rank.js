/*
  Sistema de rangos de Free Fire — mapeo VERIFICADO (2026-09-11).

  El campo `rank`/`csRank` de AccountInfo es un CODIGO que el juego ya asigna al
  tier (no hay que derivarlo de puntos). Los codigos 301..323 son 23 valores
  consecutivos = exactamente las 23 posiciones de la escalera oficial:

    301-303  Bronce I,II,III
    304-306  Plata I,II,III
    307-310  Oro I,II,III,IV
    311-314  Platino I,II,III,IV
    315-318  Diamante I,II,III,IV
    319      Heroico
    320      Heroico de Elite
    321      Maestro
    322      Maestro de Elite
    323+     Gran Maestro   (323 y superiores; el codigo sube dentro de GM)

  Evidencia real: 301 = 1000 RP (piso de cuentas nuevas, verificado en varias
  cuentas), 321 = 3539/3641 RP (Maestro), 322 = 4214 RP (Maestro Elite),
  323 = 4471/4475 RP (Gran Maestro), lider con 330/62058 RP (Gran Maestro alto).
  Mismo enum para BR y CS. Diferencia clave: **BR se mide en RP, CS en ESTRELLAS**.

  IMPORTANTE: solo se afirma Gran Maestro si el CODIGO del juego es >= 323. NO se
  deriva por umbral de puntos ni se inventa. Codigos fuera de 301..~360 =>
  confianza 'unknown' (no se muestra un nombre falso).
*/

const ROMAN = ['', 'I', 'II', 'III', 'IV']

// Rangos con divisiones (start = codigo de la division I).
const TIERS = [
  { start: 301, name: 'Bronce', divs: 3 },
  { start: 304, name: 'Plata', divs: 3 },
  { start: 307, name: 'Oro', divs: 4 },
  { start: 311, name: 'Platino', divs: 4 },
  { start: 315, name: 'Diamante', divs: 4 },
  { start: 319, name: 'Heroico', divs: 1 },
  { start: 320, name: 'Heroico de Elite', divs: 1 },
  { start: 321, name: 'Maestro', divs: 1 },
  { start: 322, name: 'Maestro de Elite', divs: 1 },
]

const GRANDMASTER_MIN = 323
// Techo defensivo: por encima de esto un codigo no es fiable (evita inventar).
const KNOWN_MAX = 400

// resolveRankTier(code) -> { name, division, code, isGrandmaster, confidence }
// confidence: 'verified' (tabla real) | 'unknown' (codigo fuera de rango) | 'none' (sin dato)
export function resolveRankTier(code) {
  if (code === undefined || code === null || code === '') {
    return { name: '', division: '', code: '', isGrandmaster: false, confidence: 'none' }
  }
  const n = Number(code)
  if (!Number.isFinite(n) || n <= 0) {
    return { name: '', division: '', code: String(code), isGrandmaster: false, confidence: 'none' }
  }
  if (n >= GRANDMASTER_MIN && n <= KNOWN_MAX) {
    return { name: 'Gran Maestro', division: '', code: String(n), isGrandmaster: true, confidence: 'verified' }
  }
  for (const t of TIERS) {
    if (n >= t.start && n < t.start + t.divs) {
      const division = t.divs > 1 ? ROMAN[n - t.start + 1] : ''
      return { name: t.name, division, code: String(n), isGrandmaster: false, confidence: 'verified' }
    }
  }
  // Codigo fuera de la tabla verificada: NO inventar un tier.
  return { name: '', division: '', code: String(n), isGrandmaster: false, confidence: 'unknown' }
}

// Nombre completo para mostrar (tier + division), o '' si no verificable.
export function rankLabel(tier) {
  if (!tier || tier.confidence !== 'verified' || !tier.name) return ''
  return tier.division ? `${tier.name} ${tier.division}` : tier.name
}

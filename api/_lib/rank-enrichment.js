/*
  Rank Enrichment Layer — COMPLEMENTA a SiamBhau por-campo, no lo reemplaza.

  Filosofia: cada dato de rango puede venir de una fuente distinta y se etiqueta
  con provenance (source) + confidence. Si un campo es fiable en la fuente
  primaria (ej: BR RP de SiamBhau, verificado contra el juego), se conserva. Si
  un campo no es fiable (ej: estrellas CS de SiamBhau != las del juego), se marca
  'unavailable' y se puede completar con un proveedor secundario VERIFICADO.
  NUNCA se fabrican datos ni se reemplaza el perfil completo.

  El "emblema" de rango se representa como una CLAVE DE TIER (brTierKey/csTierKey)
  que el frontend estiliza con CSS de DaniVex (badge por color). NO es un asset
  del juego falso: no se encontro un catalogo de emblemas verificable.
*/

import { validateBrRank } from './rank-rules.js'

// Clave de tier para el emblema/badge (ES + PT, porque FreeFireMania usa PT/ES:
// Platina/Platino, Mestre/Maestro, Prata/Plata, Ouro/Oro, Bronze/Bronce, ...).
export function tierKey(rankName) {
  const n = String(rankName || '').toLowerCase()
  if (!n) return ''
  if (/gran\s*maestro|gr[ãa]o?\s*-?\s*mestre|grand\s*master/.test(n)) return 'grandmaster'
  if (/maestro|mestre|master/.test(n)) return 'master'
  if (/heroico|heroic|her[oó]i/.test(n)) return 'heroic'
  if (/diamante|diamond/.test(n)) return 'diamond'
  if (/platino|platina|platinum/.test(n)) return 'platinum'
  if (/\boro\b|ouro|gold/.test(n)) return 'gold'
  if (/plata|prata|silver/.test(n)) return 'silver'
  if (/bronce|bronze/.test(n)) return 'bronze'
  return ''
}

// enrichRanks(profile, { secondaryCs }) -> metadata de rangos por-campo.
// secondaryCs (opcional): { stars, season, rank, source } de un proveedor
// secundario YA verificado. Si no se pasa, estrellas/temporada de CS quedan
// 'unavailable' (no se inventan).
export function enrichRanks(profile, opts = {}) {
  const p = profile || {}
  const sec = opts.secondaryCs || null

  // --- Battle Royale (verificado contra el juego: RP + temporada de SiamBhau) ---
  const brName = p.rankBR || ''
  const brPoints = p.rankBRPoints || ''
  const brSeason = p.season || ''
  const brRankConfidence = brName ? validateBrRank(brName, brPoints) : 'unavailable'

  // --- Clash Squad ---
  // TIER: preferentemente el codigo autoritativo del juego (p.rankCS, resuelto por
  // csTierFromCode en el provider) — GENERAL y live. Si no hay, un proveedor
  // secundario verificado (sec.rank). ESTRELLAS/temporada: solo de una observacion
  // verificada (sec); ninguna fuente live las expone => nunca se inventan.
  // Precedencia del TIER: proveedor live inyectado (sec.rank) > codigo del juego
  // (p.rankCS). csFromCode = el tier viene del codigo autoritativo (no de un inyectado).
  const injectedRank = sec && sec.rank ? String(sec.rank) : ''
  const csName = injectedRank || p.rankCS || ''
  const csFromCode = !injectedRank && Boolean(p.rankCS)
  const csStars = sec && sec.stars != null && String(sec.stars) !== '' ? String(sec.stars) : ''
  const csSeason = sec && sec.season != null && String(sec.season) !== '' ? String(sec.season) : ''

  return {
    // BR
    brRankSource: brName ? 'siambhau+rank-rules' : '',
    brPointsSource: brPoints ? 'siambhau' : '',
    brSeasonSource: brSeason ? 'siambhau' : '',
    brRankConfidence,
    brPointsConfidence: brPoints ? 'verified' : 'unavailable',
    brSeasonConfidence: brSeason ? 'verified' : 'unavailable',
    brTierKey: tierKey(brName),

    // CS — tier del codigo del juego (general/live) o de proveedor secundario.
    csRankName: csName, // nombre de tier CS resuelto
    csRankSource: csName ? (csFromCode ? (p.rankCSSource || 'game-csrank') : (sec && sec.source ? sec.source : 'secondary-provider')) : '',
    csRankConfidence: csName ? (csFromCode ? (p.rankCSConfidence || 'verified') : 'verified-secondary') : 'unavailable',
    csStars,
    csSeason,
    csStarsSource: csStars ? (sec && sec.source ? sec.source : 'secondary-provider') : 'unavailable',
    csSeasonSource: csSeason ? (sec && sec.source ? sec.source : 'secondary-provider') : 'unavailable',
    csStarsConfidence: csStars ? 'verified-secondary' : 'unavailable',
    csTierKey: tierKey(csName),
  }
}

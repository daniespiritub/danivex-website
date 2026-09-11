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

// Clave de tier para el badge visual (color/estilo en el front). No es un asset.
export function tierKey(rankName) {
  const n = String(rankName || '').toLowerCase()
  if (!n) return ''
  if (n.includes('gran maestro')) return 'grandmaster'
  if (n.includes('maestro')) return 'master'
  if (n.includes('heroico')) return 'heroic'
  if (n.includes('diamante')) return 'diamond'
  if (n.includes('platino')) return 'platinum'
  if (n.includes('oro')) return 'gold'
  if (n.includes('plata')) return 'silver'
  if (n.includes('bronce')) return 'bronze'
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

  // --- Clash Squad (sin datos verificables en la fuente primaria; rango/estrellas/
  // temporada solo si un proveedor secundario VERIFICADO los aporta) ---
  const csName = p.rankCS || (sec && sec.rank ? String(sec.rank) : '')
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

    // CS (vacio salvo proveedor secundario verificado)
    csRankName: csName, // nombre de tier CS resuelto (live o secundario/verificado)
    csRankSource: csName ? (sec && sec.source ? sec.source : 'secondary-provider') : '',
    csRankConfidence: csName ? 'verified-secondary' : 'unavailable',
    csStars,
    csSeason,
    csStarsSource: csStars ? (sec.source || 'secondary-provider') : 'unavailable',
    csSeasonSource: csSeason ? (sec.source || 'secondary-provider') : 'unavailable',
    csStarsConfidence: csStars ? 'verified-secondary' : 'unavailable',
    csTierKey: tierKey(csName),
  }
}

/*
  Catálogo de emblemas de rango de Free Fire (BR y CS).

  FUENTE OFICIAL: guía oficial de rangos de Garena
  (https://rankguide.us.freefiremobile.com), que carga los emblemas desde el CDN
  oficial de Free Fire:
    https://dl.dir.freefiremobile.com/common/OB44/test/*-280x280.png (BR)
    https://dl.dir.freefiremobile.com/common/OB44/test/CS_new_rank_icons/* (CS)
    https://dl.dir.freefiremobile.com/common/OB54/CSH/GMiconUpdate/* (Grandmaster)

  Se descargó una COPIA ESTABLE (280x280 PNG transparente) a public/ff-emblems/
  para no depender de rutas de temporada del CDN. Verificados visualmente uno a
  uno el 2026-09-11 (p.ej. rank-br-heroic = escudo rojo + águila + estrella,
  coincide con el juego para el UID de prueba: Heroico / 3539 RP / S53).

  BR y CS usan emblemas DISTINTOS (la guía oficial los sirve en carpetas
  separadas), por eso el catálogo distingue por modo. El emblema representa el
  TIER (sin división): se usa el emblema de la división I de cada tier.

  provenance: source (oficial), verifiedAt, visualVerified.
*/

export const RANK_EMBLEMS_META = {
  source: 'Garena Free Fire — guía oficial de rangos (rankguide.us.freefiremobile.com) / CDN dl.dir.freefiremobile.com',
  verifiedAt: '2026-09-11',
  visualVerified: true,
  note: 'Copia estable self-hosted en /ff-emblems. BR y CS tienen emblemas distintos. El fallback es el badge CSS.',
}

// tierKeys que produce el backend (ver rank-enrichment tierKey()).
const TIERS = new Set(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'heroic', 'master', 'grandmaster'])

// Devuelve la ruta pública del emblema para (modo, tier) o '' si no hay.
// modo: 'br' | 'cs'. Ante cualquier tier desconocido -> '' (el front usa el badge CSS).
export function rankEmblemSrc(mode, tierKey) {
  const t = String(tierKey || '').toLowerCase()
  if (!TIERS.has(t)) return ''
  const m = mode === 'cs' ? 'cs' : 'br'
  return `/ff-emblems/rank-${m}-${t}.png`
}

/*
  Resolver GENERAL de insignias / titulos de perfil de Free Fire.

  El perfil expone un `badgeId` (basicInfo.badgeId). Segun su rango de ID es:
   - 1001xxxxxx  -> Insignia de PASE ELITE (icon UI_EPFP_*). Ej: 1001000100 =
                   "Mystery Badge" (insignia comodin de Pase Elite).
   - 904xxxxxx   -> TITULO de perfil (icon FF_Icon_Title_*).

  El NOMBRE sale de un catalogo compacto (id -> nombre) de datos publicos del
  juego. La IMAGEN sale del mismo CDN keyless de iconos por ID que ya usamos para
  outfit/pet (jsdelivr). Nunca inventa: si el id no esta en el catalogo, devuelve
  el badge con la imagen por ID pero sin nombre; si no hay badgeId, devuelve null.

  General y reutilizable: funciona con cualquier UID que exponga un badge/title
  identificable. Un UID sin badge => null (no se muestra nada). Fallback: si la
  imagen no carga, el frontend oculta la insignia.
*/

import BADGE_CATALOG from './badge-catalog.js'

const ICON_BASE = process.env.FF_ITEM_ICON_BASE || 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG'
const ICON_EXT = process.env.FF_ITEM_ICON_EXT || 'png'

function iconUrl(id) {
  if (!id || !ICON_BASE) return ''
  return `${ICON_BASE.replace(/\/$/, '')}/${id}.${ICON_EXT}`
}

// Tipo de badge segun el rango de ID.
function badgeType(id) {
  if (/^1001/.test(id)) return 'elite-pass'
  if (/^904/.test(id)) return 'title'
  return 'badge'
}

// resolveBadge(badgeId) -> { id, name, type, image, source, confidence } | null
export function resolveBadge(badgeId) {
  const id = String(badgeId || '').replace(/[^\d]/g, '')
  if (!id || id === '0') return null
  const entry = BADGE_CATALOG[id] || null
  const image = iconUrl(id)
  if (!entry && !image) return null
  return {
    id,
    name: entry ? entry.name : '',
    type: badgeType(id),
    image,
    source: 'ff-item-db',
    confidence: entry ? 'verified' : 'derived',
  }
}

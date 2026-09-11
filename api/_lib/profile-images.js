/*
  Resolvers de IMAGEN de perfil (avatar y banner), SEPARADOS del resolver de
  items del outfit. Motivo: el avatarId de Free Fire (ej 102000004) es el
  personaje base (Adam por defecto), NO el avatar/foto de perfil equipado. El
  avatar real equipado esta en `headPic` (ej 902033014 = emblema). El banner
  equipado esta en `bannerId` (ej 901000008). Verificado visualmente 2026-09-11
  con UID 2196518104.

  Prioridad (independiente de las prendas):
    AVATAR : URL real de proveedor de perfil (FreeFireMania) > catalogo(headPic)
             > catalogo(avatarId) [ultimo recurso] > vacio.
    BANNER : URL real de proveedor de perfil > catalogo(bannerId) > vacio.

  Las prendas (clothes/weaponSkins) siguen usando el resolver de items (jsDelivr)
  intacto: esto NO lo toca.
*/

const CATALOG_BASE = process.env.FF_ITEM_ICON_BASE || 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG'
const CATALOG_EXT = process.env.FF_ITEM_ICON_EXT || 'png'

export function itemIconUrl(id) {
  if (!id) return ''
  return `${CATALOG_BASE.replace(/\/$/, '')}/${id}.${CATALOG_EXT}`
}

// Una URL "real de proveedor" es cualquiera http(s) que NO provenga del catalogo
// de items (jsDelivr/CDN por ID). Asi, si en un snapshot viejo quedo cacheada una
// URL de catalogo derivada del ID equivocado, se ignora y se re-deriva del ID.
export function isCatalogUrl(url) {
  const u = String(url || '')
  if (!u) return false
  return u.includes('cdn.jsdelivr.net') || u.includes('/ShahGCreator/') || (CATALOG_BASE && u.startsWith(CATALOG_BASE))
}

function realProviderUrl(url) {
  const u = String(url || '')
  return /^https?:\/\//.test(u) && !isCatalogUrl(u) ? u : ''
}

// Devuelve { url, source } para el AVATAR. Nunca usa avatarId salvo ultimo recurso.
export function resolveAvatar(profile) {
  const real = realProviderUrl(profile?.avatar)
  if (real) return { url: real, source: profile?.avatarSource || 'provider' }
  if (profile?.headPic) return { url: itemIconUrl(profile.headPic), source: 'catalog:headPic' }
  if (profile?.avatarId) return { url: itemIconUrl(profile.avatarId), source: 'catalog:avatarId' }
  return { url: '', source: '' }
}

// Devuelve { url, source, fallback } para el BANNER. `fallback` es el asset por
// bannerId en el catalogo (jsDelivr, sin hotlink): lo usa el frontend en onError
// si la URL principal (proveedor de perfil) fallara al renderizar.
export function resolveBanner(profile) {
  const catalog = profile?.bannerId ? itemIconUrl(profile.bannerId) : ''
  const real = realProviderUrl(profile?.banner)
  if (real) return { url: real, source: profile?.bannerSource || 'provider', fallback: catalog }
  if (catalog) return { url: catalog, source: 'catalog:bannerId', fallback: '' }
  return { url: '', source: '', fallback: '' }
}

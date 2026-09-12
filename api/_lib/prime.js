/*
  Resolver de Prime — mapea el NIVEL de Prime (dato live del provider, por cuenta) a un
  emblema visual DISTINTO por nivel. resolvePrime(level), NUNCA resolvePrime(uid): el
  emblema depende SOLO del nivel, asi que no hay hardcode ni leakage por cuenta.

  Nota de asset: el emblema oficial del juego (FF_UI_PrimeBadage{1..8}) es una textura de
  UI-atlas SIN fuente publica descargable no-gated (solo tras el Referer-gate de ffinfo,
  que NO se evade). Se usa un emblema DaniVex por nivel (SVG, en el frontend), con un tier
  de color distinto por nivel — honesto: NO se presenta como el asset oficial. Cuando
  aparezca una fuente legitima del PNG oficial, basta con enchufar emblemUrl aqui.
*/

// Tier de color por nivel (progresion visual: bronce -> ... -> prismatico). Cada nivel
// se ve distinto => nunca "Prime 3 con badge de Prime 8".
const PRIME_TIERS = {
  1: { name: 'bronze', c1: '#c8873f', c2: '#8a5a2b' },
  2: { name: 'steel', c1: '#aab4c2', c2: '#6b7380' },
  3: { name: 'gold', c1: '#f2c230', c2: '#b8890c' },
  4: { name: 'emerald', c1: '#37d67a', c2: '#1e8449' },
  5: { name: 'sapphire', c1: '#3aa0e6', c2: '#1f6dad' },
  6: { name: 'amethyst', c1: '#b06cd6', c2: '#6c3483' },
  7: { name: 'ruby', c1: '#ef5350', c2: '#a93226' },
  8: { name: 'prismatic', c1: '#ff6ec4', c2: '#7873f5', c3: '#42e695' },
}

const MAX_PRIME_LEVEL = 8

// URL del PNG oficial por nivel, SOLO si se configura una fuente legitima (env
// PRIME_BADGE_BASE => `${base}/prime-${n}.png`). Si no hay base, no hay asset oficial
// y se usa el emblema DaniVex (fallback, claramente marcado). El asset oficial del juego
// (FF_UI_PrimeBadage) no tiene fuente publica no-gated conocida (Referer-gate ffinfo, que
// NO se evada; Mobileverso captcha-gated y sin el dato) => hoy no hay emblemUrl oficial.
const PRIME_BADGE_BASE = process.env.PRIME_BADGE_BASE || ''

// resolvePrime(level) — GENERAL por NIVEL (nunca por uid). Contrato:
//   { level, active, displayName, emblemLevel, emblemUrl, assetType, tier,
//     isVerifiedGameAsset, fallback, source, confidence }
// emblemLevel === level SIEMPRE (garantia: el badge corresponde al nivel; "Prime 3 con
// badge 8" es imposible). isVerifiedGameAsset=false + fallback=true cuando se usa el SVG
// DaniVex => la UI NO lo presenta como oficial. level 0 / fuera de rango => inactivo.
export function resolvePrime(level, opts = {}) {
  const raw = level == null || level === '' ? 0 : Number(level)
  const n = Number.isFinite(raw) ? Math.trunc(raw) : 0
  const active = n >= 1 && n <= MAX_PRIME_LEVEL
  const tier = active ? PRIME_TIERS[n] : null
  const officialUrl = active && PRIME_BADGE_BASE ? `${PRIME_BADGE_BASE.replace(/\/$/, '')}/prime-${n}.png` : ''
  const hasOfficial = Boolean(officialUrl)
  return {
    level: n > 0 ? n : 0,
    active,
    displayName: active ? `Prime ${n}` : 'Sin Prime',
    emblemLevel: active ? n : 0, // == level (garantia de correspondencia)
    emblemKey: active ? `prime-${n}` : '',
    emblemUrl: officialUrl, // '' si no hay fuente oficial legitima configurada
    assetType: !active ? '' : (hasOfficial ? 'game-asset' : 'danivex-svg'),
    isVerifiedGameAsset: hasOfficial, // el SVG DaniVex NO es un asset verificado del juego
    fallback: active && !hasOfficial, // true => la UI debe marcarlo como emblema DaniVex
    tier, // colores para el emblema DaniVex (frontend)
    source: opts.source || (n > 0 ? 'siambhau' : ''),
    confidence: n === 0 ? 'verified' : (active ? 'verified' : 'unavailable'),
  }
}

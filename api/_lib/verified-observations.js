/*
  Verified Observations layer (capa general y transparente).

  Algunos campos del perfil no los expone ninguna fuente automatica (API/CDN),
  pero el propietario/verificador de la cuenta los observa DIRECTAMENTE dentro del
  juego. Esas observaciones son una fuente valida y se registran aqui con
  procedencia EXPLICITA, para no confundirlas nunca con datos de API en vivo.

  Precedencia de datos (la resuelve la capa de normalizacion/enriquecimiento):
    1) proveedor live verificado para ese campo   (mayor prioridad)
    2) verified in-game observation (esta capa)
    3) snapshot previamente verificado
    4) fallback no verificado
    5) unavailable

  => Si en el futuro un proveedor live devuelve el campo, SUSTITUYE a esta capa
     automaticamente (esta capa solo rellena huecos que live deja vacios).

  Diseno: almacen GENERAL keyed por `${REGION}:${UID}`, reutilizable para cualquier
  perfil. NO es un `if (uid === ...)` dentro de componentes ni un hack de UI: es
  una tabla de observaciones con procedencia, consumida por el pipeline de perfil.
  Solo contiene datos realmente verificados; nunca valores inventados.

  Caso registrado: Clash Squad del UID 2196518104 (US), verificado por captura
  in-game el 2026-09-11: 55 estrellas, temporada S38, rango observado Gran Maestro.
  Battle Royale NO se registra aqui (BR sale live de SiamBhau: Heroico/3539/S53).
*/

// Normaliza la clave region:uid (uid solo digitos, region en mayusculas).
function keyFor(uid, region) {
  const u = String(uid || '').replace(/[^\d]/g, '')
  const r = String(region || '').trim().toUpperCase()
  return u && r ? `${r}:${u}` : ''
}

// Regiones equivalentes (algunos proveedores usan NA en vez de US).
const REGION_ALIASES = { NA: 'US' }

// Observaciones verificadas in-game. Cada campo lleva su procedencia.
const OBSERVATIONS = {
  'US:2196518104': {
    cs: {
      rank: 'Gran Maestro',
      stars: '55',
      season: '38',
      source: 'in-game-verification',
      confidence: 'verified',
      verifiedAt: '2026-09-11',
    },
  },
}

export function getVerifiedObservation(uid, region) {
  const r = String(region || '').trim().toUpperCase()
  const canonical = REGION_ALIASES[r] || r
  return OBSERVATIONS[keyFor(uid, canonical)] || null
}

// Adaptador para enrichRanks: devuelve el "secondaryCs" {stars, season, rank,
// source} desde la observacion verificada, o null. enrichRanks ya prioriza el
// dato live: esto solo completa cuando live no trae CS.
export function verifiedSecondaryCs(uid, region) {
  const obs = getVerifiedObservation(uid, region)
  const cs = obs && obs.cs
  if (!cs) return null
  const out = { source: cs.source || 'in-game-verification', confidence: cs.confidence || 'verified' }
  if (cs.stars) out.stars = cs.stars
  if (cs.season) out.season = cs.season
  if (cs.rank) out.rank = cs.rank
  return out.stars || out.season || out.rank ? out : null
}

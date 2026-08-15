/*
  Política central de frescura para el read-through / stored fallback.

  No hay TTLs dispersos: fresh y stale se definen aquí y se pueden sobreescribir
  por env (config central). Se eligen ventanas MODERADAS a proposito: no usar un
  TTL largo para "ocultar" fallos de proveedores.
*/

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

function numberFromEnv(name, fallback) {
  const raw = Number(process.env[name])
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback
}

// FRESH: dentro de esta ventana se responde desde DaniVex SIN llamar a
// proveedores. 10 min: evita golpear proveedores en consultas repetidas del
// mismo UID sin presentar datos realmente viejos (un perfil de FF no cambia de
// forma relevante en 10 minutos).
export const PROFILE_FRESH_TTL_MS = numberFromEnv('PROFILE_FRESH_TTL_MS', 10 * MINUTE)

// STALE: mas viejo que fresh pero AUN usable como fallback si TODOS los
// proveedores fallan. 7 dias: ventana de resiliencia ante caidas de proveedor,
// siempre marcada como no-actual. Mas alla => expired (no se usa).
export const PROFILE_STALE_MAX_AGE_MS = numberFromEnv('PROFILE_STALE_MAX_AGE_MS', 7 * DAY)

/*
  Clasifica la frescura de un perfil almacenado por su lastObservedAt.
  Devuelve: 'fresh' | 'stale' | 'expired' | 'unknown'.
  opts permite override por request (solo lo usa el hook de test en no-prod).
*/
export function classifyFreshness(lastObservedAt, now = Date.now(), opts = {}) {
  if (!lastObservedAt) return 'unknown'

  const observed = Date.parse(lastObservedAt)
  if (Number.isNaN(observed)) return 'unknown'

  const age = now - observed
  const freshTtl = opts.freshTtlMs ?? PROFILE_FRESH_TTL_MS
  const staleMax = opts.staleMaxAgeMs ?? PROFILE_STALE_MAX_AGE_MS

  if (age < 0) return 'fresh' // reloj adelantado: tratar como fresh, no romper
  if (age <= freshTtl) return 'fresh'
  if (age <= staleMax) return 'stale'
  return 'expired'
}

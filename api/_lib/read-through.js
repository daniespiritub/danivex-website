/*
  Orquestacion PURA del read-through / stored fallback.

  No hace fetch ni toca KV directamente: recibe el perfil almacenado, su
  clasificacion de frescura y funciones inyectadas (refresh, persist). Asi es
  100% testeable con mocks, sin depender de FreeFireJornal real.

  Decision:
    stored fresh                      -> servir desde DaniVex (sin provider, sin persist)
    stale/expired/unknown/missing     -> refresh() (provider)
      refresh ok                      -> persist + servir fresh
      refresh fail + stored 'stale'   -> servir stored (marcado stale, sin persistir)
      refresh fail + (expired|missing)-> fallo normal (NO usar expired como fallback)
*/

export async function resolveProfile({ stored, freshness, refresh, persist }) {
  if (stored && freshness === 'fresh') {
    return { servedFrom: 'cache_fresh', profile: stored, cache: { hit: true, state: 'fresh' } }
  }

  const refreshed = await refresh()

  if (refreshed.ok) {
    await persist(refreshed.response)
    return { servedFrom: 'provider', profile: refreshed.response, cache: { hit: false, state: 'fresh' }, provider: refreshed.provider, fallback: refreshed.fallback }
  }

  // El refresh fallo. Solo se usa fallback si hay stored y esta 'stale'
  // (nunca 'expired'). No se persiste ni se altera el contentHash.
  if (stored && freshness === 'stale') {
    return {
      servedFrom: 'cache_stale',
      profile: stored,
      cache: { hit: true, state: 'stale', fallback: true },
      refreshReason: refreshed.reason,
    }
  }

  return { servedFrom: 'none', refreshReason: refreshed.reason }
}

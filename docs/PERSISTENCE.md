# PERSISTENCE (Fase 1 — best-effort)

> Implementación: `api/free-fire-uid.js` (`persistProfile`) reusando `api/_lib/private-db.js` (`saveCachedProfile`). Rama `phase-1-stabilization`.

## Qué hace
Tras un lookup de perfil **exitoso** (FreeFireMania o FreeFireJornal), el handler persiste el perfil normalizado en el Redis/Upstash ya conectado, bajo la clave `danivex:ffuid:{uid}`. Esto **activa la capa de persistencia que existía dormida** desde Fase 0.

```
lookup exitoso → respuesta normalizada → persistProfile (await, best-effort) → respuesta al usuario
```

## Garantías (reglas de PASO 5)
- **Aditivo**: solo escribe tras un éxito. No cambia el contrato ni la respuesta.
- **Solo escritura**: en Fase 1 **no** se sirve desde la DB (sin read-through). No se introduce staleness ni se cambia el comportamiento de lectura. El read-through queda como decisión posterior.
- **Fail-safe** (el punto crítico): `persistProfile` hace `await saveCachedProfile(...)` envuelto en try/catch que **traga cualquier error** y lo registra. `provider success + DB failure = el usuario igual recibe su resultado`. Verificado por `tests/persistence.test.js` (sin KV → `{saved:false}`, nunca lanza).
- **No se persiste** en hits de `SEED_CACHE` (ya son datos semilla conocidos), solo lookups nuevos.

## Coste
Una escritura KV (~10–50 ms) en el camino de éxito, hecha con `await` para garantizar la escritura (decisión aprobada). En serverless no hay "background" fiable sin `waitUntil` (dependencia nueva); si la latencia importara, esa es la optimización futura.

## Observabilidad
Evento `ff_uid_persist { uid, saved, reason }` en los logs (ver `OBSERVABILITY.md`).

## Verificación end-to-end (vercel dev)
`db-status?uid=X` → `cached:false` → lookup → `db-status?uid=X` → `cached:true, provider:"..."`; log `ff_uid_persist saved:true`.

## Siguiente (PASO 6)
Hoy `saveCachedProfile` sobrescribe el "último" perfil por UID (una clave por UID, no acumula). El **dedup por content-hash** y los snapshots históricos se abordan en el bloque de deduplicación, para no guardar copias idénticas cuando empecemos a acumular historial.

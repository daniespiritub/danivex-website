# SNAPSHOT_DEDUP + modelo histórico mínimo (Fase 1)

> Implementación: `api/_lib/private-db.js` (`stableProfileHash` + `saveCachedProfile`). Cubre PASO 6 (dedup) y el núcleo mínimo de PASO 7.

## Problema
Si cada lookup persistiera una copia, acumularíamos cientos de snapshots idénticos del mismo jugador. La visión pide historial **útil**, no ruido.

## Dedup por content-hash
`stableProfileHash(profile)` calcula un **sha1** (`node:crypto`, built-in, sin dependencia) sobre una serialización estable de los **campos significativos**:

```
nickname, region, regionCode, level, exp, likes, gameVersion, pass,
clan, clanId, clanLevel, clanMembers, bio, avatar, banner, diamonds, primeLevel
```

**Excluidos** (volátiles — no cuentan como "cambio relevante"): `lastLogin`, `accountAge`, `creationDate`, `sourceUrl`, `provider`, y todos los timestamps. Así, un simple tick de "último acceso" o un cambio de proveedor que sirvió **no** genera un snapshot nuevo.

El orden de campos es fijo (determinista) → hash estable. Verificado por tests (`tests/persistence.test.js`): mismo contenido = mismo hash; cambio de `level` = hash distinto; cambio solo de campos volátiles = mismo hash.

## Read-modify-write en `saveCachedProfile`
```
normalizar → hash → leer existente
  ├─ hash igual  → NO reescribe snapshot; solo lastObservedAt + observedCount++   (dedup:true)
  └─ hash distinto/nuevo → escribe record con contentHash + firstObservedAt
                            (preservado) + lastObservedAt + observedCount++        (changed:true si existía)
```
Sigue siendo **best-effort / fail-safe**: cualquier error de KV se traga y el lookup no se rompe. La lectura previa añade una operación KV (aceptado).

## Modelo mínimo resultante (núcleo de PASO 7, sin más entidades)
El record almacenado bajo `danivex:ffuid:{uid}` es hoy el equivalente mínimo de:
- **Player**: los campos del perfil (uid, nickname, level, …).
- **DataSource**: campo `provider` (qué fuente lo sirvió).
- **PlayerSnapshot** (noción mínima): `contentHash`, `firstObservedAt`, `lastObservedAt`, `observedCount`. Aún **no** se guarda una lista/historial de snapshots (una sola entrada "última" por UID); eso —y `PlayerEvent` (LEVEL_UP, etc.)— se aborda cuando decidamos el store de historial. NO se implementaron Equipment/Wishlist/Passes/GuildHistory (fuera de alcance de Fase 1).

## Verificación e2e (vercel dev)
3 lookups del mismo UID: `observedCount` 1 → 2 → 3; el 1º `dedup:false`, los siguientes `dedup:true`. Log `ff_uid_persist`.

## Observabilidad
`ff_uid_persist { uid, saved, dedup, changed, observedCount, reason }` (ver `OBSERVABILITY.md`).

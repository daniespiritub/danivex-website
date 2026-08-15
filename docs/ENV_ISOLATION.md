# ENV_ISOLATION (Production Readiness Gate — punto 1)

> Implementación: `api/_lib/env-namespace.js`, aplicado en `api/_lib/rate-limit.js`, `api/_lib/private-db.js`, `api/visits.js`.

## Current behavior (verificado)
Production, Preview y Development apuntan al **mismo Upstash/Redis** (`inspired-bluegill-122385...upstash.io`) — una sola integración conectada a los 3 entornos. Verificado con `vercel env pull` por entorno (mismo host en los tres; tokens nunca mostrados).

Antes de este cambio, todas las claves eran globales:
- `danivex:visits` (contador)
- `danivex:ffuid:{uid}` (perfiles persistidos)
- `rl:ip:*` / `rl:uid:*` (ventanas de rate-limit)

## Risk
Un deploy de **preview**, o un **`vercel dev`** local, escribían en el Redis de **producción**: inflaban el contador de visitas, ensuciaban la caché de perfiles y compartían/consumían las ventanas de rate-limit de prod. Contaminación cruzada de entornos. **Riesgo: Alto** (integridad de datos de producción).

## Solution
Namespace por entorno derivado de `VERCEL_ENV` (`api/_lib/env-namespace.js`): `nsKey(k)` → `prod:k` | `preview:k` | `dev:k`. Default seguro **`dev`** si `VERCEL_ENV` no está definido (nunca escribe por accidente en `prod`). Aplicado a **todas** las claves Redis.

Verificado en vivo (`vercel dev` = namespace `dev`): un POST de visitas + un lookup de `2196518104` crearon `dev:danivex:visits` y `dev:danivex:ffuid:2196518104`, mientras que `danivex:visits` (prod) **siguió en 34** y `danivex:ffuid:2196518104` (prod) quedó intacto.

## Affected keys
| Antes (global) | Después (namespaced) |
|----------------|----------------------|
| `danivex:visits` | `{env}:danivex:visits` |
| `danivex:ffuid:{uid}` | `{env}:danivex:ffuid:{uid}` |
| `rl:ip:{ip}:{endpoint}` | `{env}:rl:ip:{ip}:{endpoint}` |
| `rl:uid:{uid}` | `{env}:rl:uid:{uid}` |

## Backward compatibility
- **Contador de visitas**: sin migración se resetearía a 0 (viola "nunca se reinicia"). Solución: **migración perezosa, solo en prod, aditiva e idempotente** (`seedLegacyVisitsOnce` en `api/visits.js`): si `prod:danivex:visits` no existe, se siembra con `SET ... NX` desde el valor legacy `danivex:visits`. La clave legacy **no se borra**.
- **Perfiles persistidos** (`danivex:ffuid:*` legacy): son pura caché; las nuevas claves namespaced se re-populan solos en cada lookup. Las legacy quedan huérfanas pero **inofensivas** (no se borran).
- **Rate-limit**: claves efímeras (TTL 60s); las legacy expiran solas.
- **Sin migrar/borrar/renombrar datos manualmente.** Ningún cambio de contrato público.

## Rollback
Revertir el/los commit(s) de este bloque (`git revert`) hace que la app vuelva a usar las claves legacy sin prefijo. Como **no se borró** ninguna clave legacy, el rollback **no requiere ninguna acción manual sobre Redis**: `danivex:visits` sigue existiendo (con el valor previo al deploy) y se vuelve a leer. Las claves namespaced quedan huérfanas, inofensivas.

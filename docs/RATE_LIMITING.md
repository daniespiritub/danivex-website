# RATE_LIMITING

> Fase 1, rama `phase-1-stabilization`. Implementación: `api/_lib/rate-limit.js`. Aplicado en `api/free-fire-uid.js`, `api/free-fire-prime.js`, `api/visits.js`.

## Problema
Las funciones serverless del scanner hacían requests salientes a proveedores de terceros (FreeFireMania/Jornal) sin ningún límite y con CORS `*` — es decir, un **proxy de scraping abierto**. Cualquiera podía usarlas para bombardear a los proveedores desde la reputación IP del proyecto (riesgo H1 del `RISK_REGISTER`).

## Solución
Rate limiting de **ventana fija** sobre el **Redis/Upstash que ya existe** (no se añadió infraestructura nueva). Claves con `INCR` + `EXPIRE`.

### Límites elegidos y por qué
| Ámbito | Límite | Clave | Razón |
|--------|--------|-------|-------|
| IP × endpoint | **30 / 60 s** | `rl:ip:{ip}:{endpoint}` | Un humano prueba varios UIDs en una sesión (legítimo), pero 30/min corta el bombardeo automatizado. |
| UID global | **10 / 60 s** | `rl:uid:{uid}` | Frena el scraping en bucle del mismo UID aunque el atacante rote IPs. Un usuario real no reconsulta el mismo UID 10 veces por minuto. |

`visits` usa solo el límite por IP (no tiene UID).

### Respuesta al exceder
- HTTP **429** + header `Retry-After: {segundos}` (TTL restante de la ventana).
- Body: `{ ok:false, error:'rate_limited', scope:'ip'|'uid', retryAfter }`.
- Es un código **nuevo** respecto al contrato original, pero **compatible**: los consumidores del frontend ya toleran respuestas no exitosas (`lookupFreeFireUid`/`lookupFreeFirePrime` manejan `!ok`).

## Propiedad de seguridad: FAIL-OPEN
Si Redis no está configurado o falla (timeout/red), el limiter **permite** la request (`hitWindow` devuelve `allowed:true`). El rate limiting nunca debe romper una búsqueda que hoy funcionaría. Verificado por test (`tests/rate-limit.test.js`).

## IP del cliente
Se toma la **primera** IP de `x-forwarded-for` (la que Vercel antepone), con fallback a `x-real-ip` y `unknown`. No se registra ni persiste la IP; solo se usa efímeramente como parte de la clave de conteo (TTL 60s).

## Cómo ajustar
Cambiar `IP_LIMIT` / `UID_LIMIT` en `api/_lib/rate-limit.js`. Sin migraciones: las claves expiran solas.

# SYSTEM_ARCHITECTURE

> Commit `36d2714`. Separa estrictamente lo que EXISTE de lo RECOMENDADO.

## CURRENT (lo que existe realmente)

```
                 ┌──────────────────────────┐
                 │  SPA React/Vite (static) │  src/
                 │  router manual por path  │  App.jsx:954
                 └───────────┬──────────────┘
        3 fetch()            │
   ┌──────────────┬──────────┴───────────┐
   ▼              ▼                       ▼
/api/visits  /api/free-fire-uid    /api/free-fire-prime
   │              │                       │
 Redis      SEED_CACHE(mem)          KNOWN_PRIME_CACHE(mem)
(danivex:    → Mania (403 en prod)    → artículo estático Jornal
 visits)     → Jornal (fallback)
                    │
             (NO persiste nada)

  [DORMIDO, no conectado]:
   private-db.js (KV get/save perfiles) ← db-status.js, save-free-fire-profile.js
```

Características: monolito serverless por endpoint, sin capa de servicio, sin persistencia en el flujo del scanner, sin cache real, sin rate limiting, sin tests, sin observabilidad.

## TARGET (arquitectura recomendada — modular monolith, NO microservicios)

```
            ┌─────────────────┐
            │ DaniVex Web App │  (SPA actual, sin reescribir)
            └────────┬────────┘
                     │  contratos estables /api/*
              ┌──────▼───────┐
              │ DaniVex API  │  handlers finos
              └──────┬───────┘
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   Cache(Redis)  Persistence   Provider Layer
   TTL+SWR+       (Redis KV,    (interface común)
   coalescing     snapshots)         │
                                ┌────┴─────┐
                                ▼          ▼
                          FreeFireJornal  (futuros)
                          FreeFireMania
```

Principios (orden de prioridad del brief §43): Correctness → Maintainability → Security → Observability → Performance → DX → Scalability. Un **modular monolith** sobre las funciones Vercel actuales es suficiente; **no** hay caso para microservicios ni colas todavía.

Pieza central recomendada: **`PlayerDataProvider` interface** (ver `ADR-001`) para que el frontend nunca dependa de un sitio de terceros y se pueda añadir/reordenar proveedores sin tocar UI.

## ENV_VARS

| Variable | Used by | Purpose | Required | Secret |
|----------|---------|---------|----------|--------|
| `KV_REST_API_URL` | server (`visits.js`, `private-db.js`, `db-status.js`) | endpoint REST Upstash | sí (para KV) | no |
| `KV_REST_API_TOKEN` | server (idem) | token REST Upstash | sí (para KV) | **sí** |
| `KV_REST_API_READ_ONLY_TOKEN` | (provisto por integración, sin uso en código) | lectura KV | no | sí |
| `KV_URL` / `REDIS_URL` | (provisto, sin uso en código) | conexión Redis TCP | no | sí |
| `UPSTASH_REDIS_REST_URL` | fallback en `private-db.js:209` | alt URL KV | no | no |
| `UPSTASH_REDIS_REST_TOKEN` | fallback en `private-db.js:210` | alt token KV | no | sí |

Sin valores copiados. `.env.local` está en `.gitignore`. No hay secretos expuestos al frontend (los proveedores son scraping público sin auth).

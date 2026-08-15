# PROVIDER_LAYER (Fase 2 — implementado)

> Ejecuta el plan de `PROVIDER_EXTRACTION_PLAN.md`. Rama `phase-2-provider-layer`. **Contrato de `/api/free-fire-uid` sin cambios** (los 34 tests previos siguen verdes).

## Estructura
```
api/_lib/
├── http.js                     getHtmlWithFetch(url, timeoutMs) — fetch compartido
├── normalize.js                buildResponse — forma comun de respuesta
└── providers/
    ├── text-utils.js           htmlToText, pick, clean, parseNumber, ...
    ├── freefiremania.js        { name, label, getProfile(uid) } + parsers Mania
    ├── freefirejornal.js       { name, label, getProfile(uid) } + parser Jornal
    └── index.js                profileProviders[] + fetchProfileFromProviders()
```

## Interface `PlayerDataProvider`
Cada proveedor exporta:
- `name` (id corto), `label` (texto de `provider` en la respuesta)
- `getProfile(uid)` → `{ ok:true, profile, sourceUrl }` | `{ ok:false, outcome, error?, sourceUrl }`

`outcome` ∈ `empty | timeout | http_error | error` (via `classifyFetchError`).

## Orquestación (`providers/index.js`)
`fetchProfileFromProviders(uid, { logEvent })` recorre `profileProviders` **en orden** (prioridad): FreeFireMania → FreeFireJornal. Devuelve la respuesta ya normalizada del primero con perfil (`fallback: i>0`), o `{ ok:false, reason: 'not_found' | 'provider_error' }`. Emite `ff_uid_provider` por intento (logging inyectado, sin acoplar).

El handler (`api/free-fire-uid.js`) quedó fino: read-through → `fetchFromProviders` (wrapper con el hook de test) → `fetchProfileFromProviders`. Ya no contiene parsing ni fetch.

## Añadir un proveedor
Crear `providers/<nuevo>.js` con `getProfile` y agregarlo al array `profileProviders`. Sin tocar el handler ni la UI. (Ej. futuro: una API oficial si aparece verificada.)

## Estado de proveedores
FreeFireMania = `PROVIDER_DEGRADED` (403 desde Vercel), FreeFireJornal = efectivo en prod. Ver `PROVIDER_STATUS.md`. **Sin bypasses de anti-bot.**

## No incluido (deliberado)
`/api/free-fire-prime` **no** se migró a la capa (sigue autónomo, `LOW_COVERAGE`). NormalizedPlayer completo, Player Profiles, etc. son fases posteriores.

## Verificado
`npm test` 38/38 (incluye 4 tests de la capa con `fetch` mockeado: Mania primary, fallback a Jornal, ambos fallan → `provider_error`, ambos vacíos → `not_found`), lint limpio, build OK, y end-to-end con `vercel dev` (`2196518104`).

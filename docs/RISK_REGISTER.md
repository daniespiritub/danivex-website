# RISK_REGISTER

> `Verified` = comprobado en código o en vivo. `Potential` = plausible, requiere confirmación. Commit `36d2714`.

## Critical

| # | Riesgo | Tipo | Evidencia | Mitigación propuesta |
|---|--------|------|-----------|----------------------|
| C1 | **Dependencia total de scraping de terceros.** Todo el scanner depende de FreeFireMania/Jornal. Un cambio de HTML o bloqueo rompe la feature. | Verified | `free-fire-uid.js`, `free-fire-prime.js` | Provider Layer + persistencia (servir último snapshot si el proveedor cae). `ADR-001`. |
| C2 | **FreeFireMania ya bloquea las IPs de Vercel (403).** El "primary" no funciona en prod; solo el fallback Jornal responde. Si Jornal también bloquea, el scanner queda sin datos nuevos. | Verified (curl prod) | `DATA_SOURCE_RESEARCH.md` | Persistir consultas (degradación elegante) + no depender de un solo host. |

## High

| # | Riesgo | Tipo | Evidencia | Mitigación |
|---|--------|------|-----------|-----------|
| H1 | **Sin rate limiting.** `/api/free-fire-uid` es un proxy de scraping abierto (CORS `*`). Abuso puede quemar la reputación IP del proyecto contra los proveedores. | Verified | grep vacío; `free-fire-uid.js:47` | Rate limit por IP/UID sobre el Redis ya disponible. |
| H2 | **Cero persistencia.** Cada consulta se descarta. Imposible historial/timeline/comparaciones (toda la visión del brief). | Verified | scanner no llama `saveCachedProfile` | Conectar `private-db.js` al flujo (quick win). |
| H3 | **Errores enmascarados como HTTP 200.** Fallos de proveedor devuelven `ok:false` con 200 → invisibles a monitoreo por status. | Verified | `free-fire-uid.js:102-117` | Logging estructurado + métricas de tasa de fallo. |

## Medium

| # | Riesgo | Tipo | Evidencia | Mitigación |
|---|--------|------|-----------|-----------|
| M1 | **Deep-link `/cuenta/{uid}.html` roto (404).** El código lo maneja pero Vercel 404ea antes del SPA. Feature de compartir muerta. | Verified (curl 404) | `App.jsx:956`, `vercel.json` sin rewrite | Añadir rewrite `/cuenta/*` → `/` (quick win). |
| M2 | **Cobertura de Prime mínima.** `free-fire-prime` solo resuelve UIDs de un artículo estático + 1 en caché. | Verified | `free-fire-prime.js:135` | Reevaluar fuente de Prime; hoy es poco útil. |
| M3 | **Drift de seeds.** 3 copias divergentes del cache semilla. | Verified | `free-fire-uid.js:3`, `private-db.js:17`, `_data/uid-cache.json` | Fuente única tras conectar persistencia. |
| M4 | **`main.jsx` borra storage y caches en cada carga.** Anula caché de cliente y rompe la deduplicación del contador de visitas (cada reload cuenta como sesión nueva → sobreconteo). | Verified | `src/main.jsx:29-31` | Quitar el `clear()` global o acotarlo; mover dedup del contador a server/cookie. |

## Low

| # | Riesgo | Tipo | Evidencia | Mitigación |
|---|--------|------|-----------|-----------|
| L1 | `generateMockPlayer` (genera datos falsos) sigue en el repo aunque no se usa. Riesgo si se recablea. | Verified | `src/data/primeScanner.js:174` | Borrar en Fase 1. |
| L2 | Bundle `androidDevices.generated.js` 918 KB sin split. | Verified | build warning | Code-splitting/lazy. |
| L3 | Archivos muertos (`app/layout.js`, `_data/uid-cache.json`) confunden el mapa mental. | Verified | §12 CURRENT_STATE_AUDIT | Limpiar. |
| L4 | Sin tests → cualquier refactor del scraper puede regredir silenciosamente. | Verified | sin framework | Tests de regresión antes de refactor (Fase 1). |

## No es riesgo (aclaración)
SSRF está **mitigado**: el UID se sanea a dígitos y se interpola en hosts fijos; no hay URL controlada por usuario (`free-fire-uid.js:55`, `free-fire-prime.js:32`).

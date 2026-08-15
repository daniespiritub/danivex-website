# READ_THROUGH_CACHE (Fase 1.5 — Read-through / Stored Fallback)

> Implementación: `api/free-fire-uid.js` (handler), `api/_lib/read-through.js` (orquestación pura), `api/_lib/cache-policy.js` (frescura), `api/_lib/private-db.js` (`getStoredProfile`), `api/_lib/rate-limit.js` (límites separados). Rama `phase-1.5-read-through`. **Solo aplica a `/api/free-fire-uid`.**

## Objetivo
Antes: cada consulta llamaba al proveedor y persistía. Ahora DaniVex sirve desde su propia persistencia cuando puede (menos tráfico a terceros) y, cuando los proveedores fallan, responde con el último perfil almacenado marcado como no-actual.

## Política de frescura (central, `api/_lib/cache-policy.js`)
| Constante | Valor | Override env |
|-----------|-------|--------------|
| `PROFILE_FRESH_TTL_MS` | **10 min** | `PROFILE_FRESH_TTL_MS` |
| `PROFILE_STALE_MAX_AGE_MS` | **7 días** | `PROFILE_STALE_MAX_AGE_MS` |

`classifyFreshness(lastObservedAt)` → `fresh | stale | expired | unknown`:
- `age ≤ 10 min` → **fresh**
- `10 min < age ≤ 7 días` → **stale**
- `age > 7 días` → **expired**
- sin/invalid `lastObservedAt` → **unknown**

**Por qué estos valores:** fresh 10 min evita golpear proveedores en consultas repetidas del mismo UID sin presentar datos realmente viejos. Stale 7 días es una ventana de resiliencia ante caídas de proveedor, **siempre marcada como no-actual**. No se usa un TTL largo para ocultar fallos: pasados 7 días el dato se considera expired y **no** se usa como fallback.

## Flujo de decisión (`api/_lib/read-through.js`)
```
Request UID
  → seed cache (2 UIDs hardcodeados)? → responder fresh
  → stored (KV)? clasificar frescura
      fresh   → responder desde DaniVex (SIN proveedor, SIN persistir)
      stale/expired/unknown/missing → refresh (proveedores Mania→Jornal)
          success → persistir (dedup) → responder fresh
          failure:
              stored 'stale'  → responder stored marcado stale (SIN persistir)
              expired/missing → fallo normal (contrato de error actual)
```

## Metadata de respuesta (aditiva, no rompe contrato)
- Fresh desde proveedor: `"cache": { "hit": false, "state": "fresh" }`
- Fresh desde DaniVex: `"cache": { "hit": true, "state": "fresh" }`
- Stale fallback: `"cache": { "hit": true, "state": "stale", "fallback": true, "lastObservedAt": "...", "source": "..." }`
- Fallo sin caché usable: `{ ok:false, ... }` (sin `cache`).

El campo `cacheHit` existente se mantiene. Ejemplos completos en `docs/API_CONTRACT.md`.

## Semántica de persistencia
- **Fresh cache hit** → NO se persiste (no se duplica snapshot).
- **Refresh success** → persistencia normal con dedup (`contentHash`/`observedCount`).
- **Stale fallback** → **NO se persiste ni se altera el `contentHash`**: no se simula una nueva observación verificada del proveedor.

## Interacción con rate limiting
- **Límite por IP (30/60s)**: aplica a **toda** request (protege el endpoint), incluidos cache hits.
- **Límite por UID (10/60s)**: se consume **solo cuando se va a refrescar** (llamada externa). Un **fresh cache hit no lo consume** → un usuario que repite un UID que DaniVex ya sirve no es penalizado. `enforceIpRateLimit` / `enforceUidRateLimit` en `api/_lib/rate-limit.js`.
- Si el UID está rate-limited al intentar refrescar y hay stored **stale**, se sirve el stale (sin tráfico externo); si no hay stored usable, `429`.

## Hooks de test (solo no-prod)
En `preview`/`dev` (nunca en `production`, guardado por `envNamespace()`): `?__test_fresh_ttl_ms=`, `?__test_stale_max_ms=`, `?__test_force_provider_fail=1` permiten ejercitar stale/expired/fallo sin manipular datos reales.

## Rollback
`git revert` del merge de Fase 1.5 restaura el flujo directo (proveedor→persistir→responder). **Sin acción sobre Redis** (solo se leyó/escribió con la misma semántica; el read-through no borra nada). Las claves de perfil siguen siendo compatibles.

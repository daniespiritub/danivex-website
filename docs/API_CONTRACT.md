# API_CONTRACT — Prime Scanner

> Contrato **actual** (antes de cualquier cambio de Fase 1), congelado como referencia de regresión. Rama `phase-1-stabilization`, base commit `51e0103`. Fuente: `api/free-fire-uid.js`, `api/free-fire-prime.js`. Consumidores: `src/pages/FreeFirePrimeScanner.jsx:356,372`.

Regla de compatibilidad de Fase 1: **estos contratos no pueden cambiar de forma incompatible.** Se permite AÑADIR campos; no se permite quitar/renombrar campos existentes ni cambiar códigos HTTP.

---

## `GET /api/free-fire-uid?uid={digits}`

### Request
- Método: `GET` (además `OPTIONS` → `204`).
- Query: `uid` — el servidor lo sanea a `[0-9]`, máx 14 caracteres (`free-fire-uid.js:55`).
- Headers CORS de respuesta: `Access-Control-Allow-Origin: *`, `Methods: GET,OPTIONS`, `Headers: Content-Type`.

### Códigos HTTP (actuales — INVARIANTES)
| Situación | HTTP | Body |
|-----------|------|------|
| UID vacío/no numérico | `400` | `{ ok:false, error:"UID requerido" }` |
| Preflight | `204` | (vacío) |
| Éxito (cache / Mania / Jornal) | `200` | objeto perfil `ok:true` |
| Perfil no encontrado | `200` | `{ ok:false, ..., message }` |
| Fallo de proveedor / timeout | `200` | `{ ok:false, ..., error, message }` |

> **Nota crítica**: los fallos de proveedor devuelven **200**, no 5xx. Fase 1 (observabilidad) NO cambiará estos códigos; añadirá logging del lado servidor.

### Response exitosa (`ok:true`) — claves garantizadas
```
ok, uid,
nickname, username,
region, regionCode, regionCountry,
creationDate, lastLogin, accountAge, verified,
level, exp, likes (number),
gameVersion, pass, booyahPass,
clan, clanId, clanLevel, clanMembers,
bio, skinStatus, skinError, avatar, banner,
emulator, elitePass, season, rankBR, rankCS,
provider, sourceUrl, cacheHit, savedToPrivateDb,
sourceCount, sourcesFound[],
diamonds, diamondsConfirmed, primeLevel, primeConfirmed
```
Definidas en `buildResponse` (`free-fire-uid.js:121`).

### Response de error (`ok:false`)
```json
{ "ok": false, "uid": "...", "provider": "...", "sourceUrl": "...",
  "message": "...", "error": "..." }
```
`error` solo presente en fallos técnicos (timeout/red).

### Fallback (INVARIANTE de comportamiento)
`SEED_CACHE` (memoria, 2 UIDs) → **FreeFireMania** (primary) → **FreeFireJornal** (fallback) → `ok:false`.
Estado real prod: Mania devuelve **403** desde IPs de Vercel (`PROVIDER_DEGRADED`), el camino efectivo hoy es Jornal.

### Datos opcionales
Muchos campos pueden venir `''` o `0` según el proveedor (p. ej. `clanLevel`/`clanMembers` vacíos vía Jornal; `emulator`/`season`/`rankBR` solo vía Jornal). El frontend los muestra como "No disponible". La ausencia **no** es error.

---

## `GET /api/free-fire-prime?uid={digits}`

### Request
- Método: `GET` (+ `OPTIONS` → `204`). `uid` saneado igual.

### Códigos HTTP (actuales — INVARIANTES)
| Situación | HTTP | Body |
|-----------|------|------|
| UID vacío | `400` | `{ ok:false, error:"UID requerido" }` |
| Éxito (cache / artículo) | `200` | `ok:true` con Prime |
| Prime no confirmado | `200` | `{ ok:false, ..., primeConfirmed:false, message }` |
| Fallo técnico | `200` | `{ ok:false, ..., error, message }` |

### Response (`buildPrimeResponse`, `free-fire-prime.js:83`)
```
ok, uid, provider, sourceUrl, nickname,
primeLevelNumber, primeLevel, primeConfirmed,
diamonds, diamondsConfirmed,
currentPrimeRequirement, nextRequired, nextPrimeLevel,
missingForNextPrime, primeProgressPercent, rawResult
```

### Fallback / cobertura
`KNOWN_PRIME_CACHE` (1 UID) → scraping de **un artículo estático** buscando el UID en texto plano. Sin fallback. Marcado `LOW_COVERAGE_PROVIDER` (PASO 10).

### Semántica de Prime (a preservar/clarificar en Fase 1)
Tres estados que **no deben colapsarse**:
- **Prime confirmado**: `primeConfirmed:true`, `primeLevelNumber >= 1`.
- **Prime no encontrado**: el UID no aparece en la fuente → `primeConfirmed:false`.
- **Prime desconocido**: fallo técnico → `ok:false` + `error`.

`primeLevelNumber:0` hoy significa "no confirmado", NO "el jugador tiene Prime 0 demostrado". Fase 1 documentará esto explícitamente en la UI sin cambiar el contrato.

---

## Consumidores (no romper)
- `src/pages/FreeFirePrimeScanner.jsx:356` → `lookupFreeFireUid` → `generatePlayerFromLookup` (`src/data/primeScanner.js:226`).
- `src/pages/FreeFirePrimeScanner.jsx:372` → `lookupFreeFirePrime` → `applyPrimeToPlayer`.
Ambos toleran `ok:false` y campos vacíos. Cualquier cambio debe mantener esa tolerancia.

---

## Contrato FINAL por caso (post-Fase 1 — Production Readiness Gate)

> El único añadido de Fase 1 al contrato es el **`429`** (rate limited) y campos nuevos aditivos (`verified`, `emulator`, `elitePass`, `season`, `rankBR`, `rankCS`). Ningún campo ni código existente se quitó/cambió.

### `/api/free-fire-uid`
| Caso | HTTP | `ok` | Body / provider |
|------|------|------|-----------------|
| **Success** (cache/Mania/Jornal) | `200` | `true` | perfil completo; `provider` = `DaniVex Fast Cache` \| `FreeFireMania Fast` \| `FreeFireJornal Perfil` |
| **Invalid UID** (vacío/no numérico) | `400` | `false` | `{ error:"UID requerido" }` |
| **Player not found** (nadie sirvió nickname) | `200` | `false` | `{ provider:"FreeFireJornal Perfil", message:"No se encontro perfil publico..." }` |
| **Provider timeout** | `200` | `false` | `{ error:"<AbortError>", message:"La consulta rapida no respondio..." }` (log `outcome:timeout`) |
| **Provider failure** (403/5xx en ambos) | `200` | `false` | `{ error:"HTTP 403", message:"..." }` (log `outcome:http_error`) |
| **Rate limited** | `429` | `false` | `{ error:"rate_limited", scope:"ip"\|"uid", retryAfter }` + header `Retry-After` |
| **Partial provider data** | `200` | `true` | perfil con campos faltantes = `''`/`0` (p. ej. sin `clanLevel`/`emulator` vía Jornal). La ausencia **no** es error |
| **Fallback success** (Mania 403 → Jornal) | `200` | `true` | `provider:"FreeFireJornal Perfil"` (log `fallback:true`). **Verificado en preview con `2196518104`** |

### `/api/free-fire-prime`
| Caso | HTTP | `ok` | Body / provider |
|------|------|------|-----------------|
| **Prime confirmado** | `200` | `true` | `primeConfirmed:true`, `primeLevelNumber>=1`; `provider` = `FreeFireJornal Prime Fast` \| cache |
| **Invalid UID** | `400` | `false` | `{ error:"UID requerido" }` |
| **Prime no encontrado** (UID no en artículo) | `200` | `false` | `{ primeConfirmed:false, message:"Prime no confirmado..." }` |
| **Provider timeout/failure** | `200` | `false` | `{ error, primeConfirmed:false, message:"La verificacion Prime rapida no respondio." }` |
| **Rate limited** | `429` | `false` | `{ error:"rate_limited", scope, retryAfter }` + `Retry-After` |

**Nota (LOW_COVERAGE)**: `primeLevelNumber:0` = "no confirmado", nunca "Prime 0 demostrado". Ver `PROVIDER_STATUS.md`.

### Garantías del `429` (verificadas en el gate con `2196518104`)
- **No se guarda como fallo de perfil**: el check de rate-limit ocurre **antes** de cache/provider/persistencia, así que un `429` no llama a ningún proveedor ni a `persistProfile`.
- **No modifica snapshots**: `observedCount` pasó de 2 a 12 tras 10 permitidas + 2 bloqueadas (=+10, no +12).
- **No corrompe caché**: no toca ninguna clave de perfil.

---

## Fase 1.5 — metadata de cache en `/api/free-fire-uid` (aditiva)

El único añadido es el objeto **`cache`** (aditivo; `cacheHit` y todos los campos previos se mantienen). Ver `READ_THROUGH_CACHE.md`.

**1) Respuesta fresca desde proveedor** (refresh):
```json
{ "ok": true, "uid": "2196518104", "nickname": "DaniメPepito", "provider": "FreeFireJornal Perfil",
  "cacheHit": false, "cache": { "hit": false, "state": "fresh" }, "...": "..." }
```
**2) Respuesta fresca desde DaniVex** (cache hit, sin proveedor):
```json
{ "ok": true, "uid": "2196518104", "nickname": "DaniメPepito", "provider": "FreeFireJornal Perfil",
  "cacheHit": true, "cache": { "hit": true, "state": "fresh" }, "...": "..." }
```
**3) Stale fallback** (proveedores caídos, se sirve lo almacenado marcado no-actual):
```json
{ "ok": true, "uid": "2196518104", "nickname": "DaniメPepito", "provider": "FreeFireJornal Perfil",
  "cacheHit": true,
  "cache": { "hit": true, "state": "stale", "fallback": true,
             "lastObservedAt": "2026-08-15T11:32:11.650Z", "source": "FreeFireJornal Perfil" } }
```
**4) Fallo de proveedor sin caché usable** (missing o expired):
```json
{ "ok": false, "uid": "2196518104", "provider": "FreeFireJornal Perfil",
  "message": "La consulta rapida no respondio. Intenta de nuevo." }
```
(sin objeto `cache`; HTTP **200**, contrato de error sin cambios). El `429` de rate-limit es idéntico al de Fase 1.

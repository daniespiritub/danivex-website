# HISTORICAL_INTELLIGENCE (Fase 4 — change detection + timeline)

> Implementación: `api/_lib/change-detection.js` (detección pura), `api/_lib/timeline.js` (almacenamiento), `api/_lib/private-db.js` (integración), `api/free-fire-uid.js` (logging). Rama `phase-2-provider-layer` (fases apiladas).

## Qué hace
Cuando una nueva observación de un jugador tiene contenido **distinto** al perfil almacenado (y ya existía uno previo), DaniVex detecta **qué campos cambiaron** y registra eventos en un timeline por UID. Es la base histórica de la visión (Timeline / Comparisons futuras).

## Detección (`detectPlayerEvents(prev, next)` — puro)
Compara los campos almacenados y emite eventos. Solo para datos que **realmente** persistimos y podemos comparar (no se inventan eventos):

| Evento | Campo | Nota |
|--------|-------|------|
| `NICKNAME_CHANGED` | nickname | |
| `LEVEL_UP` / `LEVEL_CHANGED` | level | UP si el número sube |
| `LIKES_CHANGED` | likes | |
| `GUILD_CHANGED` | clanId (o clan) | un solo evento aunque cambien ambos |
| `AVATAR_CHANGED` / `BANNER_CHANGED` | avatar / banner | |
| `BIO_CHANGED` | bio | |
| `PRIME_CHANGED` | primeLevel | |
| `REGION_CHANGED` | region | |

**No detectables hoy** (no se persisten): rank, outfit/skins equipadas, pet, wishlist. Se añadirán cuando esos datos se almacenen (honestidad de datos).

## Almacenamiento (`api/_lib/timeline.js`)
Lista Redis `{env}:danivex:ffevents:{uid}`, **capada a 50**, namespaced por entorno, **best-effort/fail-safe** (un fallo de KV nunca rompe la consulta). Cada entrada: `{ type, field, from, to, at }`. Se leen con `getPlayerTimeline(uid, limit)` (más nuevo primero).

## Integración
En `saveCachedProfile`, en la rama de contenido **cambiado** con perfil previo: `detectPlayerEvents(existing, normalized)` → `appendPlayerEvents`. La primera observación no genera eventos (no hay con qué comparar). En dedup (sin cambios) tampoco. Los eventos se devuelven en el resultado y `persistProfile` emite `ff_uid_change { type, field }` por cada uno (observabilidad).

## Verificado
Unit: `tests/change-detection.test.js` (8 casos: identidad, null, cada tipo, múltiples). E2E en dev (aislado): perfil sintético level 80 → lookup real level 85 → timeline con `LEVEL_UP 80→85`, `LIKES_CHANGED`, etc., y logs `ff_uid_change`.

## No incluido (deliberado)
Sin endpoint/UI de timeline todavía (Player Profiles / Cards son fases posteriores). El dato existe y es legible vía `getPlayerTimeline`.

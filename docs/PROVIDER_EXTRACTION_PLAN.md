# PROVIDER_EXTRACTION_PLAN (PASO 8)

> **PLAN, no implementación.** La extracción a Provider Layer es la línea de STOP de Fase 1: no se toca hasta revisar juntos. Este doc identifica qué se movería y cómo hacerlo reversible. Ref: `ADR-001`.

## Objetivo
Que el frontend nunca dependa de un sitio de terceros: `Frontend → DaniVex API → Provider Layer → fuentes`. Hoy el handler `api/free-fire-uid.js` mezcla fetch + parsing + fallback + normalización en un solo archivo.

## Inventario del código actual (qué es qué)

### Shared behavior (candidato a la capa, no a un proveedor)
- `getHtmlWithFetch(url)` — fetch con headers de navegador + `AbortController` (timeout). Duplicado casi idéntico en `free-fire-uid.js` y `free-fire-prime.js`.
- Saneo de UID (`[0-9]`, máx 14).
- Orquestación cache → provider → fallback → normalize.
- Rate limiting (`_lib/rate-limit.js`) y logging (`_lib/log.js`) — ya son capas transversales, se quedan fuera de los proveedores.
- Persistencia best-effort (`_lib/private-db.js`) — transversal, se queda fuera.

### Provider-specific parsing (lo que iría a cada implementación)
- **FreeFireMania**: `parseFreeFireManiaProfile`, `parseApiGrid`, `parseClanPanel`, `parseExactAge`, `parseAccountLevel`, `parseVerifiedBio`, `htmlToText` (+ helpers `pick`, `clean`, `parseNumber`, `normalizeUrl`).
- **FreeFireJornal (perfil)**: `parseFreeFireJornalProfile`.
- **FreeFireJornal (Prime)**: `extractPrimeFromStaticText`, `buildPrimeResponse`, `clampPrimeLevel`, `calculatePrimeProgress`.

### Normalization logic (candidato a la capa, compartido)
- `buildResponse` (perfil) — forma estable de salida. Debería vivir en la capa, no en un proveedor, para que todos los proveedores produzcan la misma forma.

### Timeout / error / fallback handling
- Timeout: `REQUEST_TIMEOUT_MS` (5500 perfil / 3500 prime) vía `AbortController` en `getHtmlWithFetch`.
- Error: `classifyFetchError` (`_lib/log.js`) ya clasifica timeout/http_error/error — reutilizable por la capa.
- Fallback: hoy hardcodeado Mania→Jornal en el handler; pasaría a ser un **array ordenado de proveedores** que la capa recorre.

## Interface propuesta (de `ADR-001`)
```ts
interface PlayerDataProvider {
  name: string
  getProfile(uid: string): Promise<PlayerProfile | null>   // null = "no encontrado"
  getPrime?(uid: string): Promise<PrimeData | null>
}
```
Handler futuro: `validate → cache/persist.get → for provider of [jornal, mania] getProfile → normalize(buildResponse) → persist → respond`.

## Cómo hacerlo reversible (cuando se apruebe)
1. Crear `_lib/providers/` con `freefiremania.js` y `freefirejornal.js` que **envuelvan las funciones de parseo ya existentes** (mover, no reescribir). Los tests de regresión (`tests/free-fire-uid.test.js`) siguen importando esos parsers → se actualizan los imports, la lógica no cambia.
2. Extraer `getHtmlWithFetch` y `buildResponse` a la capa compartida.
3. Reemplazar el flujo inline del handler por el recorrido del array de proveedores. **Sin cambiar el contrato** (`API_CONTRACT.md`) — los mismos tests deben pasar.
4. Cada paso es un commit aislado; si algo falla, se revierte al handler inline.

## Riesgos
- Sin los tests de regresión (ya existentes) mover parsers sería peligroso; con ellos, es seguro.
- No introducir la interface antes de tiempo para 1 solo tipo de dato: esperar a tener el segundo consumidor real (Player Profiles) evita abstracción prematura.

## STOP
No implementar nada de esto en Fase 1. Requiere revisión conjunta (fin de Fase 1).

# DATA_MODEL

> CURRENT = lo que existe. TARGET = propuesta conceptual, NO implementar en Fase 0.

## CURRENT

No hay modelo de datos formal ni base de datos relacional. Lo que existe:

- **Shape de respuesta del scanner** (implícito), definido por `buildResponse` (`api/free-fire-uid.js:121`) y consumido por `generatePlayerFromLookup` (`src/data/primeScanner.js:226`). Es un objeto plano sin `source`/`observedAt`/`confidence` por campo (salvo `regionConfidence` y `regionSource`, que son los únicos vestigios de "procedencia").
- **KV activo**: 1 clave `danivex:visits` (entero). `api/visits.js`.
- **KV dormido**: `private-db.js` guardaría perfiles bajo `danivex:ffuid:{uid}` como JSON plano con `savedAt`/`updatedAt` — pero nunca se escribe desde el scanner.
- **Seeds divergentes** (deuda): `SEED_CACHE` (`free-fire-uid.js`, 2 UIDs), `seedCache` (`private-db.js`, 2 UIDs, shape distinto), `_data/uid-cache.json` (1 UID, no importado). **Ninguna es fuente de verdad única.**

## TARGET (conceptual)

### NormalizedPlayer (envoltura por-campo con procedencia)
Solo incluir campos verificados como disponibles (ver `DATA_SOURCE_RESEARCH.md`). Cada campo:
```json
{ "value": <dato>, "source": "freefirejornal", "observedAt": "<iso>", "confidence": 0.9 }
```
Campos hoy verificables: `uid, nickname, region, level, experience, likes, guild{name,id,level,members}, rankBR, rankCS, avatar, banner, bio, gameVersion, season, emulator, elitePass, createdAt, lastSeen`. Campos NO disponibles hoy (marcar ausentes, nunca inventar): `equipment, pet, wishlist, primeLevel (confiable), stats por partida (parseables pero no extraídos)`.

### Entidades futuras (evaluar, no crear aún)
`Player`, `PlayerSnapshot` (foto por consulta), `PlayerEvent` (LEVEL_UP, GUILD_CHANGED, …), `Guild`, `PlayerRank`, `DataSource`, `ProviderRequest`. `GameAsset` (catálogo Free Fire) separado de datos del jugador (`PlayerEquipment → GameAsset`).

### Anti-snapshots-inútiles
`snapshot nuevo → hash(contenido) → igual al anterior? sí=skip / no=persist + detect changes`. Requiere hashing estable del NormalizedPlayer sin `observedAt`.

### Almacenamiento
Empezar sobre el **Redis que ya existe** (`private-db.js` como base): `player:{uid}` (último), `player:{uid}:snap:{ts}` (historial), o mejor un backend con consultas (Postgres/Supabase) cuando el historial crezca — decisión en `ADR` futuro, no ahora.

**Regla honesta (del brief §8/§27)**: nunca crear un evento ni un campo si los datos no permiten verificarlo. Preservar la política ya existente `lookupStatus: 'real' | 'not_verified'`.

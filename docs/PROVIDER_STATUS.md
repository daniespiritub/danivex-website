# PROVIDER_STATUS (PASO 9 + PASO 10)

> Estado y clasificación de los proveedores externos. Fase 1. Sin técnicas de evasión de anti-bot (regla explícita PASO 9).

## FreeFireMania — `PROVIDER_DEGRADED`

- **Rol**: perfil, primary (`api/free-fire-uid.js`).
- **Impacto actual**: responde **HTTP 403 a las peticiones originadas desde la infraestructura de Vercel**. Verificado por `curl` contra producción (`/api/free-fire-uid` → provider termina siendo `FreeFireJornal Perfil`). El mismo request funciona (200) desde otros entornos, así que es un bloqueo **por IP/origen**, no de forma del request.
- **Failure rate**: en producción es efectivamente **~100% de fallo** hoy (todo request sale por IPs de Vercel). El valor exacto y su evolución quedan ahora medibles con la observabilidad añadida (`ff_uid_provider` con `provider:freefiremania, outcome:http_error`), una vez desplegada Fase 1.
- **Comportamiento de fallback**: transparente — al fallar Mania, el handler cae a **FreeFireJornal** (`fallback:true` en el log). El usuario sigue recibiendo perfil.
- **NO se implementan bypasses** de bloqueo/anti-bot/Cloudflare. Se trata como degradado.
- **Alternativas legítimas** (a evaluar, no ahora): (a) depender de FreeFireJornal como primary y Mania como respaldo oportunista; (b) servir desde la persistencia (read-through) cuando ambos fallen —degradación elegante—; (c) una fuente/-API pública adicional si aparece verificada. Ninguna implica evadir el bloqueo.

## FreeFireMania (skins) — no disponible

El detalle de skins/ropa se carga por un endpoint AJAX aparte (`dados-jogador-api-roupas.php`) que responde **403** incluso con cookies. Sin skins por ahora. `RESEARCH_REQUIRED` para una fuente alternativa.

## FreeFireJornal (perfil) — activo

- **Rol**: perfil, fallback (hoy el proveedor **efectivo** en producción).
- **Estado**: accesible desde Vercel (HTTP 200). Es quien realmente sirve los perfiles hoy.

## FreeFireJornal (Prime) — `LOW_COVERAGE_PROVIDER`

- **Rol**: Prime, primary (`api/free-fire-prime.js`).
- **Por qué LOW_COVERAGE**: no es una API por-UID; hace scraping de **un artículo estático** y solo resuelve Prime para los UIDs que aparezcan en ese texto, más `KNOWN_PRIME_CACHE` (1 UID). Cobertura mínima.
- **No se elimina**: `/api/free-fire-prime` se mantiene por compatibilidad (contrato invariante).

### Semántica de Prime — tres estados que NO se colapsan
| Estado | Señal en la respuesta | Significado |
|--------|-----------------------|-------------|
| **Prime confirmado** | `primeConfirmed:true`, `primeLevelNumber >= 1` | dato demostrado por la fuente |
| **Prime no encontrado** | `ok:false`, `primeConfirmed:false` | el UID no aparece en la fuente |
| **Prime desconocido** | `ok:false` + `error` | fallo técnico/timeout |

**Regla (PASO 10)**: `primeLevelNumber:0` significa "no confirmado", **NO** "el jugador tiene Prime 0 demostrado". La ausencia de datos nunca se convierte en `Prime = 0` real. La UI ya refleja esto ("Consultar arriba en Prime" / "No confirmado"), y el contrato lo preserva (`API_CONTRACT.md`). Verificado por tests (`tests/free-fire-prime.test.js`: nivel 0 ⇒ `primeConfirmed:false`).

---

## Player Scanner — Matriz multi-fuente por CAMPO (verificado 2026-09-11, UID 2196518104)

DaniVex Player Scanner es un **agregador**: la mejor fuente por campo, no una única API. Todo server-side; ninguna key en el frontend.

| Campo | Fuente elegida | Endpoint | Confidence | Notas |
|-------|----------------|----------|------------|-------|
| nickname / level / exp / likes / bio | SiamBhau | `/freefireinfo/bhau` (AccountInfo) | verified | |
| Prime (nivel) | SiamBhau | `bhau` → `basicInfo.primeInfo.primeLevel` | verified | emblema PNG por-nivel: no hay catálogo verificable → sin emblema real |
| avatar / banner | SiamBhau IDs + FreeFireMania URL | `bhau` + merge keyless | verified | `headPic`/`bannerId`; jsDelivr para IDs |
| outfit / pet | SiamBhau + jsDelivr (ShahGCreator/icon) | `bhau` + CDN por ID | verified | pet usa skin equipada |
| clan (+líder) | SiamBhau | `bhau` (clanBasicInfo/captainBasicInfo) | verified | |
| **BR rank** | **reglas de RP (rank-rules.js)** | RP de `bhau` | verified | 3539 RP → Heroico. El **código** de rango NO es fiable (era el bug "Maestro") |
| BR RP / season | SiamBhau | `bhau` (`rankingPoints`/`seasonId`) | verified | |
| **BR stats (Solo/Duo/Squad)** | **SiamBhau stats** | `/freefireinfo/stats?gamemode=br&matchmode=CAREER` | verified | partidas/wins/kills/K-D/daño/HS%/max kills |
| **CS stats** | **SiamBhau stats** | `/freefireinfo/stats?gamemode=cs&matchmode=CAREER` | verified | partidas/wins/K-D/KDA/MVP/daño/HS%/derribos |
| CS rank / stars / season | — (ninguna fuente accesible) | — | unavailable | la API NO expone estrellas/temporada CS; `csRankingPoints`=142 ≠ 55★ del juego. Se muestra "no disponible" (honesto), raw interno |
| rank/prime emblem PNG | — (sin catálogo verificable/licencia-limpia) | — | fallback CSS | badges de color DaniVex; hook `resolveRankEmblem` no integrado por falta de assets verificables |

### Endpoint de stats de SiamBhau
- `GET /freefireinfo/stats?uid=&region=&gamemode={br|cs}&matchmode={CAREER|RANKED|NORMAL}&key=` → `{ success, stats }`.
- BR: `stats.{solostats,duostats,quadstats}` (quad = escuadra). CS: `stats.csstats`. Cada uno con `gamesplayed/wins/kills/detailedstats{...}`.
- **NO trae season ni stars** en ningún modo (verificado br/cs × CAREER/RANKED). Por eso CS stars/season siguen sin fuente.
- Integración: `api/_lib/providers/siambhau.js#getStats` (BR+CS CAREER en paralelo, timeout, best-effort) → `api/_lib/stats-model.js#normalizeStats` (métricas derivadas + provenance). Se adjunta como `profile.stats` en `providers/index.js`, se persiste (no entra en el content-hash), se preserva ante fallo transitorio, y se expone en `/api/player`.

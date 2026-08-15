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

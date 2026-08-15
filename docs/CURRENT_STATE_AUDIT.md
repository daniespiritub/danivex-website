# CURRENT_STATE_AUDIT

> Fase 0 — Auditoría de solo lectura. Cada afirmación está respaldada por una ruta de archivo real del repo `C:\Users\D\frontend`. Donde no se pudo verificar, se marca `RESEARCH_REQUIRED`.
> Fecha de auditoría: 2026-08-15. Commit auditado: `36d2714`.

## 1. Stack

| Capa | Tecnología | Evidencia |
|------|-----------|-----------|
| Framework UI | React 19 (`react@^19.2.6`, `react-dom@^19.2.6`) | `package.json` |
| Bundler / dev | Vite 8 (`vite@^8.0.12`, `@vitejs/plugin-react`) | `package.json`, `vite.config.js` |
| Routing | **Manual, por `window.location.pathname`** (no hay React Router) | `src/App.jsx:954-958` |
| Backend | Funciones serverless de Vercel (`api/*.js`, Node, ESM) | `api/`, `vercel.json` (`functions: api/*.js maxDuration 30`) |
| Iconos | `react-icons` (`pi` Phosphor + `fa` para redes) | `package.json`, `src/App.jsx:2-3` |
| Persistencia (activa) | Upstash Redis vía `@upstash/redis` | `package.json`, `api/visits.js` |
| Lint | ESLint 10 flat config | `eslint.config.js` |
| Tests | **Ninguno** | `package.json` (sin script `test`, sin `.test.*`) |
| Deploy | Vercel (proyecto `danivex-website`, dominio `danivex.com`) | `.vercel/`, verificado con `vercel ls` |

Es una **SPA de Vite servida como estático + funciones serverless** en el mismo proyecto Vercel. No es Next.js.

## 2. Estructura del proyecto (relevante)

```
frontend/
├── api/                         # Funciones serverless Vercel
│   ├── free-fire-uid.js         # [ACTIVO] perfil por UID (Mania → Jornal fallback)
│   ├── free-fire-prime.js       # [ACTIVO] nivel Prime (artículo estático FreeFireJornal)
│   ├── visits.js                # [ACTIVO] contador global (Redis INCR)
│   ├── save-free-fire-profile.js# [HUÉRFANO] persistir perfil en KV — sin caller
│   ├── db-status.js             # [HUÉRFANO] estado de KV — sin caller frontend
│   ├── _lib/private-db.js       # [DORMIDO] capa KV get/save perfiles
│   └── _data/uid-cache.json     # [MUERTO] seed JSON no importado por nadie
├── src/
│   ├── App.jsx                  # Home + router manual + contador de visitas
│   ├── pages/FreeFirePrimeScanner.jsx   # Prime Scanner (UI + orquestación)
│   ├── components/prime-scanner/*.jsx    # 8 componentes de presentación
│   ├── data/primeScanner.js     # Normalización + tabla Prime + región
│   ├── data/devices.js, androidDevices.generated.js  # catálogo (herramienta de sensibilidad)
│   ├── utils/sensitivity.js     # cálculo de sensibilidad
│   └── styles/prime-scanner.css # estilos del scanner
├── app/layout.js                # [MUERTO] layout estilo Next.js, no lo usa Vite
├── sw.js                        # [NEUTRALIZADO] service worker que se auto-desregistra
├── vercel.json, vite.config.js, eslint.config.js
```

## 3. Arquitectura frontend

- **Router manual**: `src/App.jsx:954-958` decide el componente por `window.location.pathname`:
  - `/` → `HomePage`
  - `/free-fire-prime-scanner` → `FreeFirePrimeScanner` (rewrite en `vercel.json` para que Vercel sirva el `index.html`)
  - `/cuenta/{digits}.html` → `FreeFirePrimeScanner` (deep-link) — **PERO ver Riesgo, esta ruta da 404 en Vercel**
- **State**: `useState`/`useEffect`/`useMemo` locales. No hay Redux/Zustand/React Query. La orquestación del scanner vive en `FreeFirePrimeScanner.jsx` (funciones `scanUidValue`, `scanPrimeValue`).
- **API client**: `fetch` directo. Solo 3 llamadas en todo el frontend:
  - `src/App.jsx:399` → `/api/visits`
  - `src/pages/FreeFirePrimeScanner.jsx:356` → `/api/free-fire-uid`
  - `src/pages/FreeFirePrimeScanner.jsx:372` → `/api/free-fire-prime`
- **Loading/errores**: pasos animados (`scannerSteps` en `src/data/primeScanner.js`), componente `LoadingScanner`, y mensajes honestos cuando no hay datos (`lookupStatus !== 'real'`).

## 4. Arquitectura backend

Tres funciones activas, cada una es un handler monolítico autocontenido (parser + fetch + normalización en el mismo archivo). No hay capa de servicios ni abstracción de proveedor.

- `api/free-fire-uid.js` — perfil. Flujo detallado en `PRIME_SCANNER_DATA_FLOW.md`.
- `api/free-fire-prime.js` — Prime. Hace scraping de **un artículo estático** de FreeFireJornal y busca el UID en texto plano (`extractPrimeFromStaticText`, `api/free-fire-prime.js:135`). Solo funciona para UIDs que aparezcan en ese artículo + un caché de 1 UID (`KNOWN_PRIME_CACHE`).
- `api/visits.js` — `redis.incr('danivex:visits')` en POST, `redis.get` en GET.

## 5. Deployment (Vercel)

`vercel.json`:
- `functions: { "api/*.js": { maxDuration: 30 } }` — timeout de 30s por función.
- `rewrites`: solo `/free-fire-prime-scanner` → `/`. **No hay catch-all SPA fallback** ni rewrite para `/cuenta/*`.
- `headers`: `no-store` para `sw.js`.
- Runtime: serverless Node por defecto (no edge). `RESEARCH_REQUIRED`: versión de Node fijada — `vercel project ls` mostró `24.x`.

## 6. Base de datos / persistencia

- **Activa**: Upstash Redis (integración marketplace conectada al proyecto). Solo la usa `api/visits.js` (una clave: `danivex:visits`). Verificado en vivo: `/api/db-status` responde `kvConfigured: true`.
- **Dormida**: `api/_lib/private-db.js` implementa get/save de perfiles en el mismo KV (`KEY_PREFIX = 'danivex:ffuid:'`) con fallback a un `seedCache` en memoria. **No está conectada al flujo del scanner** — solo la importan `db-status.js` y `save-free-fire-profile.js`, que a su vez no tienen caller en el frontend.
- **Muerta**: `api/_data/uid-cache.json` no se importa en ningún lado.

Ver `DATA_MODEL.md` y `RISK_REGISTER.md` (drift entre 3 copias de seed).

## 7. Cache

- **Servidor**: `SEED_CACHE` en memoria en `api/free-fire-uid.js:3` (2 UIDs hardcodeados). `KNOWN_PRIME_CACHE` en `api/free-fire-prime.js:15` (1 UID). No hay TTL, no hay stale-while-revalidate, no hay caché negativo, no hay coalescing de requests.
- **Cliente**: **contraproducente** — `src/main.jsx:29-31` llama `clearStaleBrowserState()` que ejecuta `localStorage.clear()` + `sessionStorage.clear()` + desregistra service workers + borra `caches` **en cada carga**. Esto anula cualquier caché de cliente e impacta la deduplicación del contador de visitas (ver Riesgo).

## 8. Variables de entorno

Ver tabla completa en `ENV_VARS` dentro de `SYSTEM_ARCHITECTURE.md`. Resumen: solo se usan las de Upstash (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) y variantes `UPSTASH_*` como fallback en `private-db.js`. **No hay claves de terceros ni secretos de Garena** (los proveedores son scraping público sin token). Ningún secreto se expone al frontend.

## 9. Testing

Ninguno. Sin framework, sin archivos de test, sin script. `playwright` está en `dependencies` pero solo lo usa `scripts/generate-og-preview.mjs` (generación de imagen OG), no para tests.

## 10. Logging / observabilidad

Ninguno explícito. Sin logs estructurados, sin métricas, sin tracing. Los errores de proveedor se tragan (`catch {}` en `free-fire-uid.js:84`) o se devuelven como `ok:false` con HTTP 200 — invisibles para monitoreo basado en status HTTP.

## 11. Seguridad

- **SSRF**: mitigado. El UID se sanea a solo dígitos y máx 14 chars (`api/free-fire-uid.js:55`, `api/free-fire-prime.js:32`) antes de interpolarse en URLs de host fijo. No hay input de URL controlado por el usuario.
- **CORS**: `Access-Control-Allow-Origin: *` en las 3 funciones. Es un proxy de lectura abierto hacia 2 hosts fijos — riesgo de abuso (bombardeo), no de exfiltración.
- **XSS**: bajo. React escapa por defecto; no hay `dangerouslySetInnerHTML` en el flujo del scanner (`RESEARCH_REQUIRED`: confirmar en `ShareCard.jsx`).
- **Sin rate limiting** en ninguna función (grep vacío). Riesgo Alto: cualquiera puede usar `/api/free-fire-uid` como proxy de scraping.
- **Secretos**: no hay hardcodeados. `.env.local` está en `.gitignore`.

Detalle en `RISK_REGISTER.md`.

## 12. Deuda técnica (verificada)

1. Capa de persistencia KV completa pero **desconectada** del scanner (`private-db.js`).
2. **3 copias divergentes** del seed cache: `free-fire-uid.js:SEED_CACHE` (2 UIDs), `private-db.js:seedCache` (2 UIDs, shape distinto), `_data/uid-cache.json` (1 UID).
3. Archivos muertos: `app/layout.js` (Next.js), `_data/uid-cache.json`, `generateMockPlayer` en `src/data/primeScanner.js`.
4. Deep-link `/cuenta/{uid}.html` **roto** (404 en Vercel, ver §5 y Riesgos).
5. Handlers monolíticos: parser + fetch + normalización mezclados en `free-fire-uid.js` (~15KB).
6. Errores de proveedor devueltos como HTTP 200 → sin señal para observabilidad.
7. Bundle `androidDevices.generated.js` de 918 KB sin code-splitting (warning de build).

## 13. Componentes reutilizables (activos verificados)

- `api/_lib/private-db.js` — **la joya reutilizable**: get/save KV ya escrito y ahora con Redis vivo. Base directa para snapshots/historial (visión §10 del brief).
- `src/data/primeScanner.js` — normalización Prime + detección de región + política honesta (`generatePlayerFromLookup`).
- Componentes de presentación en `src/components/prime-scanner/` — desacoplados de la fuente de datos, reutilizables para Player Profiles.
- El patrón de **fallback multi-proveedor** ya existe en `free-fire-uid.js` (Mania → Jornal): semilla conceptual del Provider Layer.

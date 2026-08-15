# PRIME_SCANNER_AUDIT

> Respuestas ancladas a código. Commit `36d2714`.

### ¿Dónde vive Prime Scanner?
Página: `src/pages/FreeFirePrimeScanner.jsx`. Estilos: `src/styles/prime-scanner.css`. Se monta desde `src/App.jsx:958` cuando la ruta es `/free-fire-prime-scanner` o `/cuenta/{digits}.html`.

### ¿Qué archivos participan?
- UI/orquestación: `src/pages/FreeFirePrimeScanner.jsx`
- Presentación: `src/components/prime-scanner/{UIDSearchForm,LoadingScanner,PlayerProfileCard,PrimeBadge,PrimeProgress,PrimePrivileges,AIAnalysisCard,ShareCard}.jsx`
- Datos/normalización: `src/data/primeScanner.js`
- Backend: `api/free-fire-uid.js`, `api/free-fire-prime.js`
- Persistencia dormida (no conectada): `api/_lib/private-db.js`, `api/save-free-fire-profile.js`, `api/db-status.js`

### ¿Cómo se introduce el UID?
Dos formularios independientes:
- Perfil: `UIDSearchForm` (`src/components/prime-scanner/UIDSearchForm.jsx`), `onChange` normaliza con `normalizeUid` (`src/data/primeScanner.js:335`).
- Prime: `PrimeSearchForm` (inline en `FreeFirePrimeScanner.jsx:294`), input `[^\d]` stripped a 14 chars.
- Deep-link automático: `useEffect` en `FreeFirePrimeScanner.jsx:108-112` que matchea `/cuenta/(\d+).html` — **efectivamente muerto** porque esa ruta da 404 en Vercel (ver `RISK_REGISTER.md`).

### ¿Qué validación existe?
Solo saneo a dígitos y truncado a 14 (frontend `normalizeUid`, backend `String(...).replace(/[^\d]/g,'').slice(0,14)`). No hay validación de rango/longitud mínima real ni de existencia.

### ¿Qué endpoint utiliza?
- Perfil → `GET /api/free-fire-uid?uid=` (`FreeFirePrimeScanner.jsx:356`)
- Prime → `GET /api/free-fire-prime?uid=` (`FreeFirePrimeScanner.jsx:372`)

### ¿Qué provider utiliza? / ¿Qué fallback existe?
- **Perfil**: `FreeFireMania` (primary) → si falla o no hay nickname, `FreeFireJornal` página de perfil (fallback). Antes de todo, `SEED_CACHE` en memoria (2 UIDs). Roles verificados siguiendo el flujo en `api/free-fire-uid.js:64-118`.
- **Prime**: `FreeFireJornal` (artículo estático) + `KNOWN_PRIME_CACHE` (1 UID). Sin fallback. `api/free-fire-prime.js`.

Ver `DATA_SOURCE_RESEARCH.md` para el rol de cada proveedor por campo.

### ¿Qué información recupera?
De FreeFireMania/Jornal: nickname, región, nivel, exp, likes, versión del juego, pase Booyah, gremio (nombre/ID/nivel/miembros), fecha de creación, último acceso, antigüedad exacta, avatar, banner, bio, y (solo Jornal) emulador/pase élite/temporada/rango BR/CS. De free-fire-prime: nivel Prime + diamantes (solo si el UID está en el artículo estático o en caché).

### ¿Qué información transforma?
`buildResponse` (`api/free-fire-uid.js:121`) normaliza a una forma estable. En el cliente, `generatePlayerFromLookup` (`src/data/primeScanner.js:226`) mapea a un objeto `player` con `lookupStatus: 'real' | 'not_verified'`. El Prime se calcula con `getPrimeProgress` (tabla `PRIME_REQUIREMENTS`).

### ¿Qué información devuelve?
JSON con `ok`, campos del perfil, `provider`, `sourceUrl`, `cacheHit`, y un bloque `prime` (0 hasta que se consulte el 2º buscador). Contrato completo en `PRIME_SCANNER_DATA_FLOW.md`.

### ¿Qué cachea? / ¿Qué almacena?
- Cachea: solo el `SEED_CACHE`/`KNOWN_PRIME_CACHE` en memoria (constantes hardcodeadas). **Ninguna consulta nueva se persiste.** La capa `private-db.js` que SÍ persistiría en Redis **no se invoca** desde el scanner.
- Almacena: nada por consulta. El historial (visión del brief) hoy es cero.

### ¿Qué timeouts utiliza?
`REQUEST_TIMEOUT_MS = 5500` (perfil, `free-fire-uid.js:1`), `3500` (prime, `free-fire-prime.js:1`), vía `AbortController`. Límite duro de función: 30s (`vercel.json`).

### ¿Qué errores maneja?
Todos los fallos de proveedor se devuelven como **HTTP 200 con `ok:false`** (nunca 4xx/5xx al cliente). Timeout/red → `catch` → mensaje genérico. El fallback de Jornal se dispara en `catch` silencioso (`free-fire-uid.js:84`).

### ¿Qué riesgos tiene?
Resumen (detalle en `RISK_REGISTER.md`):
- **Alto**: dependencia total de scraping de 2 sitios de terceros (uno ya bloquea IPs de Vercel — FreeFireMania devuelve 403 desde prod, por eso el fallback a Jornal es hoy el camino real). Sin rate limiting (proxy abierto). Deep-link roto.
- **Medio**: `free-fire-prime` solo cubre UIDs de un artículo estático — cobertura mínima. Errores enmascarados como 200. Drift de 3 seeds.
- **Bajo**: `generateMockPlayer` muerto pero presente (riesgo si alguien lo recablea).

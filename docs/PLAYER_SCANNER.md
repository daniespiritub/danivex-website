# Player Scanner

Herramienta de DaniVex para buscar jugadores de Free Fire por UID y mostrar su
informacion publica. Reemplaza al antiguo "Prime Scanner" (nombre visible:
**Player Scanner**). Ruta: `/player-scanner`.

## Flujo

```
Frontend (PlayerScanner.jsx)
  -> GET /api/player?uid=<uid>&region=<REGION>        (API interna DaniVex)
     -> read-through (free-fire-uid handler)
        -> cache fresca?  -> sirve cache
        -> stale/miss     -> capa de proveedores:
             1. SiamBhau        (rico; SOLO si SIAMBHAU_API_KEY; requiere region)
             2. FreeFireMania   (keyless, primary)
             3. FreeFireJornal  (keyless, fallback)
        -> normaliza (buildResponse) -> persiste snapshot (dedup por content-hash)
        -> proveedor caido -> fallback al ultimo snapshot ("Ultima informacion")
```

El frontend NUNCA habla con proveedores externos ni ve API keys: solo con
`/api/player`, que devuelve el perfil ya **normalizado** (modelo unico
`player-model.js`).

## Fuentes de datos (probadas de verdad con curl, UID 2196518104, 2026-09-11)

| Proveedor | Estado real | HTTPS | Key | Datos ricos |
|---|---|---|---|---|
| **SiamBhau** (`siambhau69.eu.cc`) | Vivo (403 sin key) | Si (cert valido, ssl_verify=0) | **Requerida** (gratis, Telegram @SiamBhau) | Si (ranks/prime/outfit/pet) |
| **HL Gaming** (`proapis.hlgamingofficial.com`) | Vivo (400 pide useruid+api) | Si | Requerida (registro) | Si (+ stats de partida) |
| **FF Community** (`developers.freefirecommunity.com`) | Vivo (401 AUTH_001) | Si | Requerida (de pago; trial solo playground) + WAF por User-Agent | Si |
| FreeFireMania | Vivo, keyless | Si | No | No |
| FreeFireJornal | Vivo, keyless (fallback) | Si | No | No |
| jinix6 free-ff-api | **Caido** (404 en todo, incl. su ejemplo) | — | — | — |
| glob-info2 (paulafredo) | **Caido** (402 DEPLOYMENT_DISABLED) | — | — | — |
| 0xMe FreeFire-Api | **Roto** (401 MAJOR_LOGIN_FAILED) | — | — | — |
| tanmay-info-api | **Roto** (500 JWT token failed, toda region) | — | — | — |
| PRINCE-LKTEAM | **Caido** (404) | — | — | — |

Conclusion: **no existe hoy una fuente keyless viva y verificable que devuelva
datos ricos.** Las que sirven datos ricos (SiamBhau, HL Gaming, FF Community)
exigen API key. La mejor por seguridad+coste es **SiamBhau** (HTTPS con cert
valido, key gratis). Las community self-hosted (0xMe/tanmay/jinix6) dependen de
un "major login"/JWT interno de Free Fire que esta caducado => caidas.

### SiamBhau: VERIFICADO end-to-end con API key (2026-09-11, UID 2196518104, US)

Request autenticada real -> `HTTP 200` (~1s). Campos reales confirmados y
mapeados: nickname, region, level, exp, likes, bio, **primeLevel** (nested en
`primeInfo.primeLevel`), **rank BR/CS** (`rank`/`csRank` como codigo de 3
digitos + `rankingPoints`/`csRankingPoints`), seasonId, clan (nombre real +
lider via `captainBasicInfo`), **outfit** (`profileInfo.clothes` = IDs), **pet**
(nombre + nivel), badgeCnt, avatarId/bannerId/headPic (IDs). **NO devuelve
stats de partida** (kills/wins/KD/damage): esos no existen en este endpoint.

- Avatar/banner llegan como IDs; sin CDN de iconos, el provider layer completa
  la URL de imagen con la fuente keyless (`mergeImagesFromKeyless`) para no
  perder la foto de perfil.
- `preserveRichFields` (private-db): si SiamBhau cae y sirve el keyless, los
  campos ricos ya guardados NO se sobrescriben con vacio.

Con la configuracion por defecto (sin key) Player Scanner usa las fuentes
**keyless**: devuelven nickname, region, nivel, exp, likes, antiguedad, creacion,
ultimo login, clan (id/nivel/miembros), bio, avatar y banner reales. Los campos
ricos (rangos BR/CS, prime, outfit, pet, titulo, badges) quedan vacios y se
muestran como "No disponible": **nunca se fabrican**.

## Activar datos ricos (SiamBhau)

1. Pedir una API key gratuita a Telegram **@SiamBhau** (grupo "Free Fire Info").
2. En Vercel (Project Settings -> Environment Variables), añadir:
   - `SIAMBHAU_API_KEY` = la key (server-side; NUNCA en el frontend).
   - Opcional `SIAMBHAU_DEFAULT_REGION` (ej: `US`) y `FF_ITEM_ICON_BASE` (CDN de
     iconos de items por ID, para renderizar avatar/outfit como imagen).
3. Redeploy. La capa de proveedores antepone SiamBhau automaticamente
   (`resolveProviders`) y empiezan a aparecer rangos/prime/outfit reales.

Nota: SiamBhau responde por HTTPS con certificado valido (verificado
2026-09-11), asi que la key viaja cifrada. El adaptador usa HTTPS por defecto.
Alternativa rica secundaria documentada: HL Gaming (HTTPS, registro).

## Variables de entorno

| Var | Obligatoria | Uso |
|---|---|---|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` (o `UPSTASH_*`) | Ya existentes | Cache + snapshots (Upstash Redis) |
| `SIAMBHAU_API_KEY` | No | Activa el proveedor rico SiamBhau |
| `SIAMBHAU_DEFAULT_REGION` | No | Region por defecto para SiamBhau |
| `SIAMBHAU_BASE_URL` | No | Override del host de SiamBhau |
| `FF_ITEM_ICON_BASE` | No | Base de CDN para iconos de items (avatar/outfit por ID) |

## Snapshots / historial

Cada consulta valida persiste un snapshot con dedup por content-hash
(`private-db.js` + `player-model.js`). Si nada relevante cambio, solo se
actualiza `lastObservedAt` (no se duplica). Si hay cambios, se guarda el snapshot
y se registran eventos (`change-detection.js`): nick, nivel, likes, clan, avatar,
banner, bio, prime, region y —con proveedor rico— rango BR/CS, titulo, pet,
outfit. El timeline se expone en `/api/free-fire-timeline`.

## Seguridad / limites

- API keys solo en env vars server-side. Nunca en frontend/localStorage/repo.
- Validacion de UID (6-12 digitos) en el endpoint.
- Rate limiting fail-open: IP 30/60s (toda request) + UID 10/60s (solo al
  refrescar contra proveedor). Ver `rate-limit.js`.
- Aislamiento de datastore por entorno (`prod:`/`preview:`/`dev:`).
- Logging estructurado sin secretos (`log.js`): provider, uid, region, ms,
  cache hit/miss, exito/error, fallback.

## Rutas

- `/player-scanner` — Player Scanner (prerender con `<head>` propio).
- `/free-fire-prime-scanner`, `/prime-scanner` — redirect 308 a `/player-scanner`.
- `/cuenta/:uid.html` — deep-link: abre Player Scanner y busca ese UID.

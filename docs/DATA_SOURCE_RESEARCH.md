# DATA_SOURCE_RESEARCH

> Proveedores reales verificados en `api/free-fire-uid.js` y `api/free-fire-prime.js`. Commit `36d2714`.

## Proveedores

### FreeFireMania (`freefiremania.com.br`)
| Campo | Valor |
|-------|-------|
| Archivo | `api/free-fire-uid.js` (`parseFreeFireManiaProfile:275`, `getHtmlWithFetch:159`) |
| Endpoint externo | `https://www.freefiremania.com.br/cuenta/{uid}.html` (scraping HTML) |
| Rol | **Perfil — primary** |
| Método | GET con headers de navegador (`free-fire-uid.js:165-181`) |
| Timeout | 5500 ms |
| Datos | nick, región, nivel, exp, likes, versión, pase, gremio+ID+nivel+miembros, fechas, antigüedad exacta, verificado, avatar, banner, bio |
| Estado real | **BLOQUEADO desde Vercel (HTTP 403)** — verificado por curl a prod. Funciona desde otras IPs. Por eso el fallback es hoy el camino efectivo. |
| Fallback | FreeFireJornal |

### FreeFireJornal (`freefirejornal.com`) — perfil
| Campo | Valor |
|-------|-------|
| Archivo | `api/free-fire-uid.js` (`parseFreeFireJornalProfile:260`) |
| Endpoint | `https://freefirejornal.com/es/perfil-jogador-freefire/{uid}/` |
| Rol | **Perfil — fallback** (hoy el proveedor efectivo en prod) |
| Datos | nick, región, nivel, exp, likes, versión, gremio+ID, fechas, emulador, pase élite, temporada, rango BR/CS, avatar, banner |
| Estado real | **Accesible desde Vercel (HTTP 200)** — verificado |
| Notas | Su "Nivel Prime" en esta página NO se usa (inconsistente con su propia tabla; `puntos totales:0`). |

### FreeFireJornal (`freefirejornal.com`) — Prime
| Campo | Valor |
|-------|-------|
| Archivo | `api/free-fire-prime.js` (`extractPrimeFromStaticText:135`) |
| Endpoint | `https://freefirejornal.com/es/descubre-tu-nivel-prime-.../` (**artículo estático**, no una API por-UID) |
| Rol | **Prime — primary (cobertura mínima)** |
| Timeout | 3500 ms |
| Datos | nivel Prime + diamantes, **solo si el UID aparece en el texto del artículo** o está en `KNOWN_PRIME_CACHE` (1 UID) |
| Fallback | Ninguno |

### Mobileverso (`mobileverso.com.br`)
No se usa en código. Auditado en investigación aparte: bloqueado por **Cloudflare anti-bot** para requests automatizados → **descartado como proveedor**. `RESEARCH_REQUIRED` si alguna vez expone una API pública.

### Garena (oficial)
No hay integración. Sin endpoints, sin tokens. `RESEARCH_REQUIRED`: no existe API pública oficial de perfiles verificada.

## Tabla de campos

| Field | Current Source | Verified | Endpoint | Real Time | Stored | Reliability | Status |
|-------|---------------|----------|----------|-----------|--------|-------------|--------|
| UID | input usuario | ✅ | — | ✅ | ❌ | alta | OK |
| Nickname | Mania→Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Region | Mania→Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Level | Jornal (`Nivel`) / Mania (`class="level"`) | ✅ | scrape | ✅ | ❌ | media | OK |
| Experience | Mania/Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Likes | Mania/Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Prime | Jornal artículo estático + caché | ⚠️ | scrape estático | parcial | ❌ | **baja** | LIMITADO |
| Guild (name/id/level/members) | Mania (todos) / Jornal (name+id) | ✅ | scrape | ✅ | ❌ | media | OK |
| Rank BR/CS | Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Avatar | Mania/Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Banner | Mania/Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Outfit / Skins | Mania (carga por AJAX aparte) | ❌ | `dados-jogador-api-roupas.php` (403) | — | ❌ | — | **RESEARCH_REQUIRED** |
| Pet | — | ❌ | — | — | ❌ | — | RESEARCH_REQUIRED |
| Passes (Booyah/Élite) | Mania (Booyah) / Jornal (Élite) | ✅ | scrape | ✅ | ❌ | media | PARCIAL |
| Wishlist | — | ❌ | — | — | ❌ | — | RESEARCH_REQUIRED |
| Emulator | Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Season | Jornal | ✅ | scrape | ✅ | ❌ | media | OK |
| Last Seen | Mania/Jornal (último acceso) | ✅ | scrape | ✅ | ❌ | media | OK |
| Estadísticas por partida (kills, etc.) | Jornal (presente en HTML, NO parseado) | ⚠️ | scrape | ✅ | ❌ | media | **NO EXTRAÍDO** |

**Conclusión clave**: ningún dato se persiste (`Stored` = ❌ en todo). Toda la plataforma futura (historial, timeline, comparaciones) depende de introducir persistencia. La infraestructura para hacerlo ya existe dormida (`private-db.js`).

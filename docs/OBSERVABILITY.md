# OBSERVABILITY

> Fase 1. Implementación: `api/_lib/log.js`. Instrumentado en `api/free-fire-uid.js` y `api/free-fire-prime.js`.

## Cómo
Cada evento es **una línea JSON a stdout** (`console.log`), que Vercel captura en los logs de la función (Dashboard → Functions → Logs, o `vercel logs`). Sin dependencias, sin servicio externo.

Forma base: `{ t, svc:"danivex", event, ...fields }`.

## Privacidad
- **No** se registran secretos ni tokens.
- **No** se registra la IP del cliente.
- **Sí** se registra el `uid`: es un identificador público de Free Fire (no PII) y es necesario para diagnosticar fallos por-consulta.

## Eventos

### `ff_uid_provider` — resultado de un intento a un proveedor
| Campo | Valores | Nota |
|-------|---------|------|
| `provider` | `freefiremania` \| `freefirejornal` | proveedor consultado |
| `outcome` | `hit` \| `empty` \| `timeout` \| `http_error` \| `error` | resultado del intento |
| `ms` | número | latencia del fetch+parse |
| `error` | string | solo en fallos |

### `ff_uid_lookup` — resultado final de la consulta de perfil
| Campo | Valores |
|-------|---------|
| `provider` | `seed_cache` \| `freefiremania` \| `freefirejornal` |
| `outcome` | `success` \| `not_found` \| `error` |
| `cache` | `hit` \| `miss` |
| `fallback` | `true` (sirvió Jornal tras fallar Mania) \| `false` |

### `ff_prime_lookup` — resultado de la consulta de Prime
| Campo | Valores |
|-------|---------|
| `provider` | `known_prime_cache` \| `freefirejornal_static` |
| `outcome` | `confirmed` \| `not_found` \| `timeout` \| `http_error` \| `error` |
| `cache` | `hit` \| `miss` |
| `ms` | latencia (cuando aplica) |
| `primeLevel` | nivel confirmado (solo en `confirmed`) |

## Preguntas que ahora se pueden responder
- ¿Qué proveedor está sirviendo realmente? (`ff_uid_lookup.provider` — hoy debería dominar `freefirejornal` por el 403 de Mania).
- ¿Con qué frecuencia se usa el fallback? (`ff_uid_lookup.fallback:true`).
- Latencia por proveedor (`ff_uid_provider.ms`).
- Tasa de fallo/timeout (`outcome` = `timeout`/`http_error`/`error`).
- Cache hit ratio (`cache:hit` vs `miss`).
- Éxito vs fracaso de consulta (`outcome:success` vs `not_found`/`error`).

## Nota
Los fallos de proveedor siguen devolviendo **HTTP 200 `ok:false`** (contrato invariante). El logging es la vía para verlos; no se cambian los códigos HTTP.

## Fase 1.5 — eventos de read-through / stored fallback
Añadidos en `api/free-fire-uid.js`:

| Evento | Campos | Distingue |
|--------|--------|-----------|
| `ff_uid_cache` | `uid`, `state` (`fresh`\|`stale`\|`expired`\|`unknown`\|`miss`) | estado del perfil almacenado al iniciar |
| `ff_uid_stale_fallback` | `uid`, `lastObservedAt` | se sirvió stored stale porque el proveedor falló |
| `ff_uid_lookup` (ampliado) | `servedFrom` (`seed_cache`\|`cache_fresh`\|`provider`\|`cache_stale`\|`none`), `provider`, `fallback` | de dónde salió la respuesta final |

Preguntas que ahora se responden:
- **Cuántas consultas evitamos enviar a terceros**: `ff_uid_lookup.servedFrom = cache_fresh` (+ `seed_cache`).
- **Cuántas veces falla Jornal**: `ff_uid_provider.provider=freefirejornal` con `outcome` = `http_error`/`timeout`/`error`.
- **Cuántas veces DaniVex salva la consulta con datos almacenados**: `ff_uid_stale_fallback` / `servedFrom=cache_stale`.

No se registran secretos, tokens ni IPs (igual que Fase 1).

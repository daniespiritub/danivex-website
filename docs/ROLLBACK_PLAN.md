# ROLLBACK_PLAN (Production Readiness Gate — punto 8)

## Estado de commits
- **`main` actual**: `51e0103` — `docs: complete DaniVex Phase 0 architecture audit`.
- **Introducidos por `phase-1-stabilization`** (8 commits, casi 100% aditivos: 4005 inserciones / 14 borrados; sin archivos eliminados, sin contrato público removido):

```
2f73a63  fix: aisla datastore por entorno (prod/preview/dev) + log de rate limit
1539651  docs: estado de proveedores y plan de extraccion
eb1f9df  feat: dedup de snapshots por content-hash + modelo historico minimo
dfd58cf  feat: persistencia best-effort de perfiles
18c738d  feat: logging estructurado (observabilidad)
314b03c  feat: rate limiting fail-open
7ddaa7b  fix: deep-link /cuenta/{uid}.html (404)
68550a9  test: congela contrato de API + regresion de scrapers
```

## Merge recomendado (para rollback simple)
Mergear con **`--no-ff`** para crear un único merge commit:
```bash
git checkout main
git merge --no-ff phase-1-stabilization
```
Así el rollback de código es **un solo `git revert`** (sin reescribir historia):
```bash
git revert -m 1 <merge-commit>
```

## Rollback operativo instantáneo (alternativa, sin git)
En Vercel, promover el deployment anterior (el actual de `main`, `51e0103`):
```bash
vercel rollback <deployment-url-anterior>
```
Efecto inmediato, sin rebuild.

## Efecto del rollback
Se revierten: deep-link (`/cuenta/*.html` vuelve a 404), rate limiting, logging, persistencia, dedup y aislamiento de entornos. Es volver al estado pre-Fase-1 (conocido y estable). Ningún dato se pierde ni corrompe.

## ¿Requiere acción manual sobre Redis/KV? — **NO**
- **Contador de visitas**: post-deploy prod usa `prod:danivex:visits` (sembrado desde el legacy). Tras rollback, prod vuelve a leer `danivex:visits` (legacy, **nunca borrado**) → sigue existiendo. Puede "volver" a su valor previo al deploy (drift menor de un contador de vanidad). Sin acción manual.
- **Perfiles**: post-deploy escribe `prod:danivex:ffuid:*`; tras rollback lee/escribe `danivex:ffuid:*` (legacy, presente). Caché, se re-popula. Sin acción manual.
- **Rate-limit**: claves efímeras (TTL 60s), expiran solas.
- **Claves namespaced huérfanas** tras rollback: inofensivas. Si se quisiera limpiar, es opcional y no urgente.

**Conclusión**: un rollback de aplicación (git revert o `vercel rollback`) restaura el comportamiento anterior **sin ninguna operación manual de datos**.

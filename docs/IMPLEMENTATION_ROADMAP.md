# IMPLEMENTATION_ROADMAP

> Fases del brief §41, aterrizadas a este repo. Fase 0 (esta auditoría) está COMPLETA.

## FASE 0 — Audit ✅ (este documento y hermanos en `/docs`)
Comprender DaniVex y Prime Scanner. Entregado: `CURRENT_STATE_AUDIT`, `PRIME_SCANNER_AUDIT`, `PRIME_SCANNER_DATA_FLOW`, `DATA_SOURCE_RESEARCH`, `SYSTEM_ARCHITECTURE`, `DATA_MODEL`, `RISK_REGISTER`, `MIGRATION_STRATEGY`, `DANIVEX_VISION`, `adr/ADR-001`.

## FASE 1 — Stabilization
- Rewrite `/cuenta/*` o retirar deep-link muerto (M1).
- Rate limiting por IP/UID sobre Redis existente (H1).
- Logging + métricas por proveedor; exponer `status` interno (H3).
- Borrar código muerto: `generateMockPlayer`, `app/layout.js`, `_data/uid-cache.json` (L1/L3).
- **Tests de regresión** del scraper con fixtures HTML guardados (los 2 proveedores) antes de tocar parsers (L4).
- Arreglar dedup del contador de visitas vs `main.jsx` clear (M4).

## FASE 2 — Provider Architecture
- `PlayerDataProvider` interface (`ADR-001`). Extraer Mania/Jornal como implementaciones. Handler fino.

## FASE 3 — Data Model + Persistencia
- Conectar `private-db.js` al flujo (getCachedProfile antes, saveCachedProfile después). Unificar seeds. Cache con TTL + degradación elegante.

## FASE 4 — Prime Scanner V2 (migración interna)
- Reordenar flujo a: UID validation → cache → stored player → provider layer → normalize → response. Sin cambiar el contrato público.

## FASE 5 — Player Profiles
- Ruta `/player/{uid}` (verificar routing; probablemente requiere rewrite y/o React Router). Reusar componentes de `src/components/prime-scanner/`.

## FASE 6 — Historical Intelligence
- Snapshots con content-hash, PlayerEvent, Timeline.

## FASE 7 — Cards + Comparison
- Sistema visual propio DaniVex (no copiar Mobileverso). `ShareCard.jsx` es el punto de partida.

## FASE 8 — DaniVex AI
- Resúmenes/comparaciones sobre datos normalizados y persistidos. Nunca fuente de datos.

## FASE 9 — Scale
- Optimizar según tráfico real (coalescing, edge cache, quizá DB con consultas si el historial lo exige).

**Recomendación de primera implementación**: Fase 1 (estabilización) + el quick-win de Fase 3 (conectar persistencia). Juntos mitigan C1, C2, H1, H2, H3 y M1 con cambios aditivos y reversibles.

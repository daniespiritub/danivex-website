# MIGRATION_STRATEGY

> Incremental, sin big-bang (brief §29). DaniVex está en producción; cada paso conserva contratos existentes.

## Principios
1. **No romper `/api/free-fire-uid` ni `/api/free-fire-prime`.** Son los únicos contratos que el frontend consume (`FreeFirePrimeScanner.jsx:356,372`). Cualquier refactor mantiene la forma de respuesta.
2. **Reusar antes que reescribir.** `private-db.js` y `primeScanner.js` ya existen y sirven.
3. **Persistir primero, abstraer después.** El mayor desbloqueo (historial) no requiere reescribir nada, solo conectar la capa dormida.
4. **Cada cambio: lint + build verdes** (hoy lo están) y verificación en preview antes de prod.

## Secuencia incremental (sin reescritura)

### Paso A — Estabilizar (bajo riesgo)
- Añadir rewrite `/cuenta/*` → `/` en `vercel.json` (arregla M1) o retirar el deep-link muerto.
- Rate limiting por IP/UID sobre el Redis existente (mitiga H1).
- Logging mínimo (contar éxito/fallo/latencia por proveedor) — devolver también un `status` interno (mitiga H3).
- Borrar código muerto (L1, L3).

### Paso B — Conectar persistencia (reusa `private-db.js`)
- En `free-fire-uid.js`, tras un lookup exitoso, llamar `saveCachedProfile(uid, profile)`.
- Al inicio, intentar `getCachedProfile(uid)` como capa previa a los proveedores (cache real con TTL) — degradación elegante cuando Mania/Jornal caen (mitiga C1/C2/H2).
- Unificar los 3 seeds en la clave KV (elimina M3).
- **Contrato de respuesta sin cambios.**

### Paso C — Introducir Provider Layer (ver `ADR-001`)
- Extraer `parseFreeFireManiaProfile` y `parseFreeFireJornalProfile` detrás de una interface `PlayerDataProvider` con `getProfile(uid)`.
- El handler queda fino: cache → provider layer (ordena/reintenta) → persist → normalize.
- Añadir proveedores nuevos sin tocar UI.

### Paso D — Snapshots e historial
- Guardar `PlayerSnapshot` con hash de contenido (evitar duplicados, `DATA_MODEL.md`).
- Detección de cambios → `PlayerEvent`. Habilita Timeline/Comparisons.

### Paso E+ — Player Profiles, Cards, AI
Encima de datos ya normalizados y persistidos. La IA nunca es fuente primaria (brief §27).

## Rollback
Cada paso es un commit aislado desplegable/revertible. Preview de Vercel antes de promover. Los pasos B–E son aditivos: si algo falla, el flujo actual (proveedor directo) sigue disponible.

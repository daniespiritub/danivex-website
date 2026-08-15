# ADR-001 — DaniVex Provider Layer

## Status
Proposed (Fase 0 — no implementado). Requiere aprobación antes de Fase 2.

## Context
Hoy el scanner llama y parsea sitios de terceros directamente dentro de los handlers (`api/free-fire-uid.js` mezcla fetch + parse + normalización). Ya existe un fallback ad-hoc Mania→Jornal, pero está hardcodeado en el flujo. Problemas verificados: FreeFireMania bloquea las IPs de Vercel (403 en prod), no hay persistencia para degradar con elegancia, y añadir/ordenar proveedores implica editar el handler.

## Options
1. **Dejar como está** (fetch+parse inline). Simple, pero frágil y no escala a más features/proveedores.
2. **Provider Layer con interface común** (`PlayerDataProvider`) e implementaciones por fuente. El handler orquesta cache → providers → persist → normalize.
3. **Microservicio de scraping separado.** Sobreingeniería para el tráfico y equipo actuales (brief §43).

## Decision
Opción 2. Interface conceptual:
```ts
interface PlayerDataProvider {
  name: string;
  getProfile(uid: string): Promise<PlayerProfile | null>;
  getPrime?(uid: string): Promise<PrimeData | null>;
}
```
El handler queda: `validate(uid) → cache.get → for provider in [jornal, mania, …] getProfile → normalize → persist → respond`. Reusa `parseFreeFireManiaProfile`/`parseFreeFireJornalProfile` existentes como dos implementaciones. **El contrato público `/api/free-fire-uid` no cambia.**

## Consequences
- (+) Añadir/reordenar proveedores sin tocar UI; testeable por proveedor con fixtures; base para persistencia y degradación elegante.
- (+) Frontend nunca depende de un sitio de terceros (regla de visión §6).
- (−) Una capa de indirección más; requiere tests antes de mover los parsers (hoy no hay tests → Fase 1 primero).
- Reversible: la interface envuelve el código actual; si se descarta, se vuelve al flujo inline sin pérdida.

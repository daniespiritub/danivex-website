# COMPARISON (roadmap — Comparison)

> `src/data/compare.js` (`comparePlayers`, `compareSummary`) + UI en `src/pages/FreeFirePrimeScanner.jsx`. Rama `phase-3-comparison`.

## Qué hace
Tras escanear un perfil real, permite comparar contra un segundo UID. Muestra una tabla lado a lado (Nivel, Me gusta, Experiencia como métricas numéricas con líder marcado; Región, Antigüedad, Clan, Cuenta creada como info) y un resumen de quién lidera más métricas.

## Diseño
- `comparePlayers(a, b)` PURO: filas `{ label, a, b, leader:'a'|'b'|'tie'|null, numeric }`. Solo datos reales presentes; no inventa. Los conteos de FF usan '.' como separador de miles → se parsean a solo dígitos.
- `compareSummary(rows)` → `'a'|'b'|'tie'` según quién lidera más métricas numéricas.
- UI additiva: segundo input de UID + botón; reusa `lookupFreeFireUid` (read-through, rate-limit, todo el pipeline). No cambia el flujo principal.

## Verificado
`tests/compare.test.js` (líder correcto, empate, null, resumen). e2e en preview con `2196518104` vs `391832240`.

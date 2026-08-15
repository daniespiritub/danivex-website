# DANIVEX_AI (determinista — sin LLM)

> Implementación: `src/data/aiSummary.js` (`buildDaniVexAiRead`), integrado en `src/pages/FreeFirePrimeScanner.jsx`. Rama `phase-2-provider-layer`.

## Principio (de la visión)
La IA de DaniVex **nunca es fuente de datos** y **no inventa**. Consume datos ya normalizados (perfil público + historial de cambios) y produce una lectura en lenguaje natural. Pipeline: `Providers → Normalized Data → Timeline → DaniVex AI` (nunca al revés).

## Qué hace
`buildDaniVexAiRead(player, events)` (puro, testeable) genera una lectura honesta:
- Identifica la cuenta (nick, UID).
- Resume datos públicos presentes (región, nivel, me gusta, antigüedad, gremio) — solo los que existen.
- Si hay historial: describe los **cambios recientes** observados por DaniVex (subió de nivel, cambió de gremio, ...), deduplicados.
- Si el perfil no está verificado: lo dice explícitamente y no genera lectura sobre datos no verificados.
- Cierra recordando que los datos son de fuentes públicas + historial, y que la IA no inventa.

Se muestra en el scanner como **"Lectura DaniVex AI"** para perfiles reales.

## Por qué determinista (y no LLM todavía)
No hay credencial de LLM configurada en el proyecto, y provisionarla requiere la cuenta/billing del usuario. La versión determinista es honesta, siempre disponible y de coste cero. Una versión con LLM real es una **mejora futura**: consumiría exactamente esta misma capa de datos (perfil + timeline) para redactar/comparar con más matices, **sin** convertirse en fuente de datos. Requiere: (1) una API key (p. ej. Anthropic) en env como secreto de servidor, (2) un endpoint server-side que llame al modelo con los datos ya normalizados.

## Verificado
`tests/ai-summary.test.js` (3 casos: no verificado → lectura honesta; real → menciona datos+gremio sin inventar; con historial → resume cambios únicos). Lint/build verdes; UI en preview.

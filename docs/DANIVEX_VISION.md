# DANIVEX_VISION

DaniVex es una plataforma **100% Garena Free Fire** (sin expansión a otros juegos). Prime Scanner deja de ser una herramienta aislada y se convierte en una de las **puertas de entrada** a un núcleo común de datos e inteligencia.

## Objetivo
```
                DANIVEX
                   │
              DaniVex Core           (API + cache + persistencia + provider layer)
                   │
      ┌────────────┼────────────┐
      │            │            │
 Prime Scanner   Profiles     History
      ├────────────┼────────────┤
    Stats       Guilds       Equipment
      ├────────────┼────────────┤
 Collections    Passes       Wishlist
      └────────────┼────────────┘
               Timeline → Comparisons → Cards → DaniVex AI
```

## Reglas invariantes (heredadas del código actual y del brief)
1. **Honestidad de datos**: nunca inventar. El código ya la respeta (`lookupStatus: 'real' | 'not_verified'`, `generatePlayerFromLookup`). La IA nunca es fuente primaria.
2. **No depender directamente de terceros desde el frontend**: siempre `Frontend → DaniVex Backend → Provider Layer → fuentes`.
3. **No big-bang**: evolución incremental sobre lo que ya funciona en `danivex.com`.
4. **Prime Scanner no desaparece**: sigue como consulta rápida mientras el mismo backend alimenta features más profundas.
5. **Arquitectura por necesidad, no por moda**: modular monolith mientras alcance; sin microservicios/colas hasta que el tráfico lo exija.

## De dónde partimos (real, hoy)
- UI + 2 endpoints de scanner + fallback multi-proveedor ya existentes.
- Persistencia KV **ya construida y con Redis vivo**, solo desconectada.
- Componentes de presentación desacoplados y reutilizables.

El camino más corto hacia la visión no es reescribir: es **conectar la persistencia dormida** y **abstraer los proveedores**. Eso desbloquea historial, timeline y comparaciones sin tocar el contrato del scanner.

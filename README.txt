DaniVex - danivex.com

Sitio oficial de DaniVex: recursos, calculadora de sensibilidad, optimizaciones,
descargas y una herramienta de consulta de nivel Prime para Free Fire.

Stack:
- React 19 + Vite
- Vercel (hosting y funciones serverless)
- ESLint

Estructura:
- src/            Componentes, paginas y estilos del sitio.
- src/pages/       Free Fire Prime Scanner (consulta de UID y nivel Prime).
- src/data/        Catalogo de dispositivos y logica de sensibilidad.
- api/             Funciones serverless (Vercel) para el Prime Scanner.
- public/          Assets estaticos (favicon, preview de enlaces, etc).
- scripts/         Utilidades de build (generacion de imagen OG/preview).

Requisitos:
- Node.js 18+

Desarrollo local:
  npm install
  npm run dev

Build de produccion:
  npm run build

Lint:
  npm run lint

Despliegue:
  vercel --prod

Variables de entorno opcionales (Prime Scanner - banco de datos privado):
  KV_REST_API_URL
  KV_REST_API_TOKEN
  o alternativamente:
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN

Notas:
- El Prime Scanner solo usa datos reales de las fuentes publicas disponibles;
  si una fuente no publica diamantes, no se inventa un nivel Prime.
- Regenerar la imagen de preview (OG/Twitter) para el link de danivex.com:
  node scripts/generate-og-preview.mjs

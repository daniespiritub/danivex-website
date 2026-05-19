DANIVEX - SCANNER FINAL COMPLETO

REEMPLAZAR / CREAR TODO EL CONTENIDO DEL ZIP.

ARCHIVOS INCLUIDOS:
- src/App.jsx
- src/pages/FreeFirePrimeScanner.jsx
- src/data/primeScanner.js
- api/free-fire-uid.js
- api/_lib/private-db.js
- api/_data/uid-cache.json
- api/save-free-fire-profile.js
- api/db-status.js

TODO LO QUE INCLUYE:
1. Multi-fuente publica:
   - FreeFireMania
   - FreeFireJornal
   - FreeFireHub
   - MobileVerso
   - ContadorFF
   - FFStats

2. Banco privado DaniVex:
   - Primero busca en DaniVex DB.
   - Si no existe, consulta fuentes publicas.
   - Si encuentra datos, intenta guardarlos.
   - Para guardado real en produccion usa KV / Upstash.

3. Datos extraidos:
   - UID
   - Nick
   - Fecha de creacion
   - Ultimo login
   - Version del juego
   - Nivel
   - EXP
   - Likes
   - Pase Booyah
   - Region
   - Clan
   - Clan ID
   - Nivel de clan
   - Miembros del clan
   - Biografia
   - Skin
   - Avatar/banner si aparecen en HTML
   - Fuente usada

4. Prime con tabla FreeFireJornal:
   Prime 1 = 100 diamantes
   Prime 2 = 1,000 diamantes
   Prime 3 = 3,000 diamantes
   Prime 4 = 10,000 diamantes
   Prime 5 = 30,000 diamantes
   Prime 6 = 60,000 diamantes
   Prime 7 = 120,000 diamantes
   Prime 8 = 200,000 diamantes

   NO EXISTE PRIME 9.

5. Calculo Prime:
   - Diamantes comprados si la fuente los publica.
   - Nivel Prime actual.
   - Cuanto falta para el siguiente Prime.
   - Progreso Prime.
   - Si no hay diamantes publicados, NO inventa Prime.

6. Rutas:
   - /free-fire-prime-scanner
   - /cuenta/UID.html

PARA PROBAR LOCAL:
cd /d C:\Users\D\frontend
vercel dev

ABRIR:
http://localhost:3000/free-fire-prime-scanner
http://localhost:3000/cuenta/391832240.html

PARA SUBIR:
npm run build
vercel --prod

VARIABLES OPCIONALES PARA BANCO PRIVADO REAL:
KV_REST_API_URL
KV_REST_API_TOKEN

o:
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

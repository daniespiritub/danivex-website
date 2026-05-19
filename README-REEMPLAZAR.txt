DANIVEX - PRIME 1 A 8

REEMPLAZAR:
- src/App.jsx
- src/pages/FreeFirePrimeScanner.jsx
- src/data/primeScanner.js
- api/free-fire-uid.js

TABLA PRIME USADA:
Prime 1 = 100 diamantes
Prime 2 = 300 diamantes
Prime 3 = 500 diamantes
Prime 4 = 1,000 diamantes
Prime 5 = 2,000 diamantes
Prime 6 = 5,000 diamantes
Prime 7 = 10,000 diamantes
Prime 8 = 20,000 diamantes

IMPORTANTE:
- No existe Prime 9.
- Si la fuente publica no muestra diamantes, DaniVex NO inventa el Prime.
- Si detecta diamantes, calcula:
  nivel Prime actual,
  diamantes recargados,
  cuanto falta para el siguiente,
  o Prime 8 maximo.

PROBAR:
vercel dev
http://localhost:3000/cuenta/391832240.html

SUBIR:
npm run build
vercel --prod

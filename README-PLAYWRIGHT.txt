DANIVEX - PLAYWRIGHT API UPGRADE

REEMPLAZAR:
api/free-fire-uid.js

MANTENER:
api/_lib/private-db.js
api/_data/uid-cache.json
api/save-free-fire-profile.js
api/db-status.js

IMPORTANTE:
Ya instalaste:
npm install playwright
npx playwright install

PARA EJECUTAR:
cd /d C:\Users\D\frontend
vercel dev

ABRIR:
http://localhost:3000/free-fire-prime-scanner
http://localhost:3000/cuenta/391832240.html

QUE CAMBIA:
- FreeFireMania se abre con navegador real Playwright.
- Espera carga de la pagina.
- Extrae HTML final.
- Si Playwright falla, usa fetch como respaldo.
- Mantiene banco privado DaniVex.
- Mantiene multi-fuente.

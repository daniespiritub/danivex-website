DANIVEX - AGREGADOR DE TODAS LAS FUENTES

REEMPLAZAR / CREAR TODO EL CONTENIDO DEL ZIP.

QUE CAMBIA:
1. Ya no se queda con el primer resultado.
2. Consulta banco privado DaniVex.
3. Consulta TODAS las fuentes publicas disponibles.
4. Fusiona los mejores campos de cada fuente.
5. Guarda el perfil enriquecido.
6. Devuelve:
   - sourcesFound
   - sourceCount
   - fieldSources
   - errors por fuente

FUENTES:
- DaniVex Private DB
- FreeFireMania
- FreeFireJornal
- FreeFireHub
- MobileVerso
- ContadorFF
- FFStats

PROBAR API:
http://localhost:3000/api/free-fire-uid?uid=3430570705

PROBAR UI:
http://localhost:3000/free-fire-prime-scanner
http://localhost:3000/cuenta/3430570705.html

COMANDOS:
cd /d C:\Users\D\frontend
vercel dev

SUBIR:
npm run build
vercel --prod

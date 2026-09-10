/*
  API interna de Player Scanner: GET /api/player?uid=<uid>&region=<REGION>

  Endpoint limpio y estable con el que habla el frontend. Delega en el handler
  de read-through (free-fire-uid) que ya implementa: capa de proveedores
  (SiamBhau -> FreeFireMania -> FreeFireJornal), normalizacion, cache, fallback a
  snapshot, rate limiting, logging y persistencia de snapshots.

  El frontend NUNCA habla con proveedores externos ni ve API keys: solo con este
  endpoint de DaniVex, que devuelve el perfil ya normalizado.
*/

import handler from './free-fire-uid.js'

export default handler

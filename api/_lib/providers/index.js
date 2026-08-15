/*
  DaniVex Provider Layer (perfil). Registro ordenado de proveedores que
  implementan la interface PlayerDataProvider ({ name, label, getProfile }).
  El orden es la prioridad: primero FreeFireMania, fallback FreeFireJornal.

  fetchProfileFromProviders recorre el registro y devuelve la respuesta ya
  normalizada del primero que da un perfil, o { ok:false, reason }. El logging
  se inyecta para no acoplar la capa a un logger concreto.

  Anadir un proveedor nuevo = agregar un modulo con getProfile y meterlo en el
  array. Sin tocar el handler ni la UI.
*/

import * as freefiremania from './freefiremania.js'
import * as freefirejornal from './freefirejornal.js'
import { buildResponse } from '../normalize.js'

export const profileProviders = [freefiremania, freefirejornal]

export async function fetchProfileFromProviders(uid, { logEvent } = {}) {
  let lastOutcome = 'empty'

  for (let i = 0; i < profileProviders.length; i += 1) {
    const provider = profileProviders[i]
    const start = Date.now()
    const result = await provider.getProfile(uid)
    const ms = Date.now() - start

    if (result.ok) {
      logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: 'hit', ms })
      return {
        ok: true,
        provider: provider.name,
        fallback: i > 0,
        response: buildResponse(uid, { ...result.profile, provider: provider.label, sourceUrl: result.sourceUrl }, false),
      }
    }

    lastOutcome = result.outcome
    logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: result.outcome, ms, error: result.error })
  }

  return { ok: false, reason: lastOutcome === 'empty' ? 'not_found' : 'provider_error' }
}

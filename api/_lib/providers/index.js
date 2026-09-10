/*
  DaniVex Provider Layer (Player Scanner). Registro ordenado de proveedores que
  implementan la interface PlayerDataProvider ({ name, label, getProfile }).
  El orden es la prioridad.

  Orden efectivo:
    1. SiamBhau  — datos ricos (rangos/prime/outfit/pet), SOLO si hay
       SIAMBHAU_API_KEY (isEnabled()). Requiere region.
    2. FreeFireMania — perfil keyless (primary).
    3. FreeFireJornal — perfil keyless (fallback).

  fetchProfileFromProviders recorre el registro y devuelve la respuesta ya
  normalizada del primero que da un perfil. Los proveedores no aplicables
  (deshabilitados o sin region) se saltan sin contar como error. El logging se
  inyecta para no acoplar la capa a un logger concreto.

  Anadir un proveedor nuevo = agregar un modulo con getProfile y meterlo en la
  lista. Sin tocar el handler ni la UI (que solo hablan con nuestra API).
*/

import * as siambhau from './siambhau.js'
import * as freefiremania from './freefiremania.js'
import * as freefirejornal from './freefirejornal.js'
import { buildResponse } from '../normalize.js'

// Base de proveedores keyless (siempre disponibles).
export const profileProviders = [freefiremania, freefirejornal]

// Proveedores opcionales activados por configuracion (ej: key). Se anteponen.
const optionalProviders = [siambhau]

// Resuelve la lista efectiva segun el entorno (key presente, etc.).
export function resolveProviders() {
  const enabled = optionalProviders.filter((p) => (typeof p.isEnabled === 'function' ? p.isEnabled() : true))
  return [...enabled, ...profileProviders]
}

// outcomes que significan "no aplica este proveedor" (no es un error real).
const SKIP_OUTCOMES = new Set(['disabled', 'no_region', 'no_key'])

export async function fetchProfileFromProviders(uid, { logEvent, region } = {}) {
  const providers = resolveProviders()
  let lastOutcome = 'empty'
  const firstDataProviderIndex = providers.findIndex((p) => !optionalProviders.includes(p))

  for (let i = 0; i < providers.length; i += 1) {
    const provider = providers[i]
    const start = Date.now()
    const result = await provider.getProfile(uid, { region })
    const ms = Date.now() - start

    if (result.ok) {
      logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: 'hit', ms })
      return {
        ok: true,
        provider: provider.name,
        fallback: i > firstDataProviderIndex,
        response: buildResponse(uid, { ...result.profile, provider: provider.label, sourceUrl: result.sourceUrl }, false),
      }
    }

    if (SKIP_OUTCOMES.has(result.outcome)) {
      logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: result.outcome, ms, skipped: true })
      continue
    }

    lastOutcome = result.outcome
    logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: result.outcome, ms, error: result.error })
  }

  return { ok: false, reason: lastOutcome === 'empty' ? 'not_found' : 'provider_error' }
}

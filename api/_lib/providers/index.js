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
import { getPasses } from './ffmania-passes.js'

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

// Construye la respuesta final para un proveedor que dio perfil. Para el
// proveedor rico (SiamBhau) enriquece best-effort y EN PARALELO: (a) completa la
// URL de avatar/banner desde la fuente keyless; (b) adjunta las stats reales de
// partidas. Si el enriquecimiento falla, el perfil base sigue intacto.
async function buildProviderResponse(provider, result, uid, region, logEvent, fallback) {
  let profile = { ...result.profile, provider: provider.label, sourceUrl: result.sourceUrl }
  // Coleccion de pases (read-only, HTML publico de FreeFireMania). Independiente
  // del proveedor de perfil, best-effort y en paralelo: si falla, el perfil sigue.
  const passesPromise = getPasses(uid).catch(() => ({ ok: false }))
  if (optionalProviders.includes(provider)) {
    const needImages = !profile.avatar || !profile.banner
    const [mergedProfile, statsResult] = await Promise.all([
      needImages ? mergeImagesFromKeyless(uid, profile, logEvent) : Promise.resolve(profile),
      typeof provider.getStats === 'function' ? provider.getStats(uid, { region }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
    ])
    profile = mergedProfile
    if (statsResult?.ok && statsResult.stats) profile.stats = statsResult.stats
    logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: statsResult?.ok ? 'stats_ok' : 'stats_miss' })
  }
  const passesResult = await passesPromise
  if (passesResult?.ok && passesResult.album) profile.passAlbum = passesResult.album
  logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: passesResult?.ok ? 'passes_ok' : 'passes_miss' })
  return { ok: true, provider: provider.name, fallback, response: buildResponse(uid, profile, false) }
}

export async function fetchProfileFromProviders(uid, { logEvent, region } = {}) {
  const providers = resolveProviders()
  let lastOutcome = 'empty'
  const firstDataProviderIndex = providers.findIndex((p) => !optionalProviders.includes(p))
  // Proveedores ricos (SiamBhau) saltados por falta de region. Si un proveedor
  // keyless luego detecta la region del jugador, se reintentan con ella.
  const skippedForRegion = []

  for (let i = 0; i < providers.length; i += 1) {
    const provider = providers[i]
    const start = Date.now()
    const result = await provider.getProfile(uid, { region })
    const ms = Date.now() - start

    if (result.ok) {
      logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: 'hit', ms })

      // RECUPERACION DE REGION: la app suele consultar sin region ("Autodetectar"),
      // y SiamBhau (rico) EXIGE la region correcta. Si SiamBhau se salto por eso y
      // ahora un keyless nos da la region real del jugador, reintentamos SiamBhau
      // con esa region para servir el perfil RICO en vez del keyless degradado.
      const detected = result.profile?.region
      if (!region && detected && !optionalProviders.includes(provider) && skippedForRegion.length) {
        for (const opt of skippedForRegion) {
          const rich = await opt.getProfile(uid, { region: detected }).catch(() => ({ ok: false }))
          if (rich.ok) {
            logEvent?.('ff_uid_provider', { uid, provider: opt.name, outcome: 'region_recovered', region: detected })
            return await buildProviderResponse(opt, rich, uid, detected, logEvent, false)
          }
        }
      }

      return await buildProviderResponse(provider, result, uid, region, logEvent, i > firstDataProviderIndex)
    }

    if (SKIP_OUTCOMES.has(result.outcome)) {
      if (optionalProviders.includes(provider) && result.outcome === 'no_region') skippedForRegion.push(provider)
      logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: result.outcome, ms, skipped: true })
      continue
    }

    lastOutcome = result.outcome
    logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: result.outcome, ms, error: result.error })
  }

  return { ok: false, reason: lastOutcome === 'empty' ? 'not_found' : 'provider_error' }
}

// Completa avatar/banner (URL de imagen) desde el primer proveedor keyless que
// responda, sin pisar los campos ricos ya obtenidos. Best-effort: cualquier
// fallo se ignora y se devuelve el perfil tal cual.
async function mergeImagesFromKeyless(uid, profile, logEvent) {
  for (const provider of profileProviders) {
    try {
      const r = await provider.getProfile(uid, {})
      if (r.ok && (r.profile.avatar || r.profile.banner)) {
        logEvent?.('ff_uid_provider', { uid, provider: provider.name, outcome: 'image_merge' })
        const avatar = profile.avatar || r.profile.avatar || ''
        const banner = profile.banner || r.profile.banner || ''
        return {
          ...profile,
          avatar,
          banner,
          avatarSource: avatar && avatar === r.profile.avatar ? provider.name : profile.avatarSource,
          bannerSource: banner && banner === r.profile.banner ? provider.name : profile.bannerSource,
        }
      }
    } catch {
      // ignorar: el merge de imagen nunca debe romper la respuesta rica.
    }
  }
  return profile
}

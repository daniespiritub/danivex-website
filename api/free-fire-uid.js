const FREE_FIRE_APP_ID = 100067

const regionGroups = [
  {
    code: 'BR',
    label: 'Brazil',
    group: 'Brazil',
    countries: ['BR'],
    language: 'pt',
  },
  {
    code: 'SA',
    label: 'Sudamerica',
    group: 'Sudamerica',
    countries: ['AR', 'CL', 'PE', 'EC', 'BO', 'PY', 'UY', 'CO'],
    language: 'es',
  },
  {
    code: 'LAN',
    label: 'Latinoamerica Norte',
    group: 'Latinoamerica Norte',
    countries: ['MX', 'GT', 'CR', 'PA', 'DO', 'SV', 'HN', 'NI'],
    language: 'es',
  },
  {
    code: 'NA',
    label: 'Norteamerica',
    group: 'Norteamerica',
    countries: ['US', 'CA'],
    language: 'en',
  },
  {
    code: 'EU',
    label: 'Europa',
    group: 'Europa',
    countries: ['ES', 'PT', 'FR', 'DE', 'GB', 'IT', 'TR'],
    language: 'es',
  },
]

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const uid = normalizeUid(request.query.uid)
  if (uid.length < 5) {
    response.status(400).json({ ok: false, error: 'invalid_uid' })
    return
  }

  const lookup = await lookupWithGarenaTopup(uid)
  response.status(lookup.httpStatus || 200).json(lookup)
}

async function lookupWithGarenaTopup(uid) {
  const startedAt = Date.now()
  const blockedCountries = []
  const errors = []

  for (const region of regionGroups) {
    for (const country of region.countries) {
      try {
        const result = await loginPlayerId(uid, country, region.language)

        if (result.blocked) {
          blockedCountries.push(country)
          continue
        }

        if (result.player) {
          return {
            ok: true,
            source: 'Garena Top-Up / Pagostore',
            provider: 'shop.garena.sg',
            uid,
            region: region.label,
            regionCode: region.code,
            regionCountry: country,
            regionGroup: region.group,
            regionConfidence: 100,
            nickname: result.player.nickname,
            avatar: result.player.img_url,
            openId: result.player.open_id,
            lookupMs: Date.now() - startedAt,
            raw: result.player,
          }
        }
      } catch (error) {
        errors.push({ country, message: error.message })
      }
    }
  }

  if (blockedCountries.length > 0) {
    return {
      ok: false,
      error: 'provider_requires_captcha',
      source: 'Garena Top-Up / Pagostore',
      provider: 'shop.garena.sg',
      uid,
      message: 'Garena devolvio captcha/DataDome al validar el UID desde servidor. No se invento nombre ni region real.',
      blockedCountries,
      lookupMs: Date.now() - startedAt,
      httpStatus: 200,
    }
  }

  return {
    ok: false,
    error: 'not_found_or_unavailable',
    source: 'Garena Top-Up / Pagostore',
    provider: 'shop.garena.sg',
    uid,
    message: 'No se pudo confirmar el UID con la tienda oficial en este momento.',
    errors,
    lookupMs: Date.now() - startedAt,
    httpStatus: 200,
  }
}

async function loginPlayerId(uid, country, language) {
  const url = 'https://shop.garena.sg/api/auth/player_id_login'
  const body = JSON.stringify({
    app_id: FREE_FIRE_APP_ID,
    login_id: uid,
  })

  const result = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': language === 'pt' ? 'pt-BR,pt;q=0.9,en;q=0.8' : 'es-419,es;q=0.9,en;q=0.8',
      'content-type': 'application/json',
      origin: 'https://shop.garena.sg',
      referer: `https://shop.garena.sg/app/${FREE_FIRE_APP_ID}/idlogin`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-session-country2name': country,
    },
    body,
  })

  const text = await result.text()
  const data = parseJson(text)

  if (result.status === 403 && looksLikeCaptcha(data, text)) {
    return { blocked: true }
  }

  if (!result.ok) {
    const message = data?.error || data?.message || `garena_http_${result.status}`
    throw new Error(message)
  }

  if (!data?.nickname && !data?.open_id) {
    return { player: null }
  }

  return {
    player: {
      nickname: data.nickname || `UID ${uid}`,
      img_url: data.img_url || '',
      open_id: data.open_id || '',
      login_id: uid,
    },
  }
}

function normalizeUid(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 14)
}

function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function looksLikeCaptcha(data, text) {
  const haystack = `${JSON.stringify(data || {})} ${text || ''}`.toLowerCase()
  return haystack.includes('captcha') || haystack.includes('datadome') || haystack.includes('captcha-delivery')
}

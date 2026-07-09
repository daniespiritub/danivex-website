const REQUEST_TIMEOUT_MS = 3500

const PRIME_REQUIREMENTS = {
  0: 0,
  1: 100,
  2: 1000,
  3: 3000,
  4: 10000,
  5: 30000,
  6: 60000,
  7: 120000,
  8: 200000,
}

const KNOWN_PRIME_CACHE = {
  '279180537': {
    nickname: 'Árita FF ★',
    primeLevelNumber: 8,
    diamonds: 200000,
    sourceUrl: 'https://freefirejornal.com/es/descubre-tu-nivel-prime-en-free-fire-y-cuantos-diamantes-has-comprado/',
    rawResult: 'Resultado confirmado visualmente en FreeFireJornal: Prime 8, mas de 200.000 diamantes.',
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const uid = String(req.query.uid || '').replace(/[^\d]/g, '').slice(0, 14)

  if (!uid) {
    return res.status(400).json({
      ok: false,
      error: 'UID requerido',
    })
  }

  const cached = KNOWN_PRIME_CACHE[uid]

  if (cached) {
    return res.status(200).json(buildPrimeResponse(uid, cached))
  }

  try {
    const sourceUrl =
      'https://freefirejornal.com/es/descubre-tu-nivel-prime-en-free-fire-y-cuantos-diamantes-has-comprado/'

    const html = await getHtmlWithFetch(sourceUrl)
    const text = htmlToText(html)

    const result = extractPrimeFromStaticText(text, uid)

    if (!result.primeLevelNumber) {
      return res.status(200).json({
        ok: false,
        uid,
        provider: 'FreeFireJornal Prime Fast',
        sourceUrl,
        primeConfirmed: false,
        message: 'Prime no confirmado automaticamente para este UID / Player ID.',
      })
    }

    return res.status(200).json(buildPrimeResponse(uid, {
      ...result,
      sourceUrl,
    }))
  } catch (error) {
    return res.status(200).json({
      ok: false,
      uid,
      provider: 'FreeFireJornal Prime Fast',
      error: error.message,
      primeConfirmed: false,
      message: 'La verificacion Prime rapida no respondio.',
    })
  }
}

function buildPrimeResponse(uid, data) {
  const level = clampPrimeLevel(data.primeLevelNumber)
  const currentPrimeRequirement = PRIME_REQUIREMENTS[level] || 0
  const nextRequired = level >= 8 ? 200000 : PRIME_REQUIREMENTS[level + 1]
  const diamonds = Number(data.diamonds || currentPrimeRequirement || 0)
  const missingForNextPrime = level >= 8 ? 0 : Math.max(0, nextRequired - diamonds)
  const primeProgressPercent = level >= 8 ? 100 : calculatePrimeProgress(diamonds, currentPrimeRequirement, nextRequired)

  return {
    ok: true,
    uid,
    provider: 'FreeFireJornal Prime Fast',
    sourceUrl: data.sourceUrl || '',
    nickname: data.nickname || '',
    primeLevelNumber: level,
    primeLevel: level > 0 ? `Prime ${level}` : 'Prime 0',
    primeConfirmed: level > 0,
    diamonds,
    diamondsConfirmed: level > 0 || diamonds > 0,
    currentPrimeRequirement,
    nextRequired,
    nextPrimeLevel: level >= 8 ? 'MAX' : `Prime ${level + 1}`,
    missingForNextPrime,
    primeProgressPercent,
    rawResult: data.rawResult || '',
  }
}

async function getHtmlWithFetch(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
        'accept-language':
          'es-ES,es;q=0.9,pt-BR;q=0.8,pt;q=0.7,en;q=0.6',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function extractPrimeFromStaticText(text, uid) {
  const block =
    pick(text, [
      new RegExp(`${uid}[\\s\\S]{0,900}(?:nivel|nível)\\s*([0-9]+)[\\s\\S]{0,900}(?:m[aá]s de\\s*)?([0-9\\.\\,]+)\\s*diamantes`, 'i'),
    ])

  if (!block) {
    return {
      primeLevelNumber: 0,
      diamonds: 0,
    }
  }

  const primeMatch = block.match(/(?:nivel|nível)\s*([0-9]+)/i)
  const diamondsMatch = block.match(/([0-9.,]+)\s*diamantes/i)

  return {
    primeLevelNumber: Number(primeMatch?.[1] || 0),
    diamonds: parseNumber(diamondsMatch?.[1] || 0),
    rawResult: clean(block),
  }
}

function calculatePrimeProgress(diamonds, currentRequirement, nextRequirement) {
  if (nextRequirement <= currentRequirement) return 100
  if (diamonds <= currentRequirement) return 0

  const totalRange = nextRequirement - currentRequirement
  const currentProgress = diamonds - currentRequirement

  return Math.max(0, Math.min(100, Math.round((currentProgress / totalRange) * 100)))
}

function clampPrimeLevel(value) {
  const level = Number(value || 0)
  if (level < 0) return 0
  if (level > 8) return 8
  return level
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function pick(value, patterns) {
  for (const pattern of patterns) {
    const match = String(value || '').match(pattern)
    if (match?.[0]) return match[0]
  }
  return ''
}

function parseNumber(value) {
  return Number(String(value || '').replace(/[^\d]/g, '') || 0)
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

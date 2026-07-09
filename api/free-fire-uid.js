const REQUEST_TIMEOUT_MS = 5500

const SEED_CACHE = {
  '391832240': {
    uid: '391832240',
    nickname: 'MashメAlan',
    region: 'SAC',
    creationDate: '13 de septiembre de 2018 às 21:35:27',
    lastLogin: '18 de mayo de 2026 às 19:24:35',
    level: '82',
    exp: '8.512.274',
    likes: 15872,
    gameVersion: 'OB53',
    pass: 'NV.52 (Não Pago)',
    clan: '-',
    clanId: '',
    clanLevel: '',
    clanMembers: '',
    bio: 'TIKTOK : MASH PRN!',
    skinStatus: 'Error al cargar skin',
    provider: 'DaniVex Fast Cache',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/391832240.html',
  },
  '3430570705': {
    uid: '3430570705',
    nickname: '+56 fortuna',
    region: 'SAC',
    creationDate: '30 de junio de 2021 às 20:29:16',
    lastLogin: '18 de mayo de 2026 às 21:11:49',
    level: '78',
    exp: '3.776.430',
    likes: 12775,
    gameVersion: 'OB53',
    pass: 'NV.04 (Não Pago)',
    clan: '6.SENFASIS',
    clanId: '2064548150',
    clanLevel: '6',
    clanMembers: '17',
    bio: 'xile stgo 19',
    skinStatus: 'Mostrar skin del jugador',
    provider: 'DaniVex Fast Cache',
    sourceUrl: 'https://www.freefiremania.com.br/cuenta/3430570705.html',
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const uid = String(req.query.uid || '').replace(/[^\d]/g, '').slice(0, 14)

  if (!uid) {
    return res.status(400).json({
      ok: false,
      error: 'UID requerido',
    })
  }

  const cached = SEED_CACHE[uid]

  if (cached) {
    return res.status(200).json(buildResponse(uid, cached, true))
  }

  const sourceUrl = `https://www.freefiremania.com.br/cuenta/${uid}.html`

  try {
    const html = await getHtmlWithFetch(sourceUrl)
    const text = htmlToText(html)
    const profile = parseFreeFireManiaProfile(text, html)

    if (!profile.nickname) {
      return res.status(200).json({
        ok: false,
        uid,
        provider: 'FreeFireMania Fast',
        sourceUrl,
        message: 'No se encontro perfil publico para este UID.',
      })
    }

    return res.status(200).json(buildResponse(uid, {
      ...profile,
      provider: 'FreeFireMania Fast',
      sourceUrl,
    }, false))
  } catch (error) {
    return res.status(200).json({
      ok: false,
      uid,
      provider: 'FreeFireMania Fast',
      sourceUrl,
      error: error.message,
      message: 'La consulta rapida no respondio. Intenta de nuevo.',
    })
  }
}

function buildResponse(uid, profile, cacheHit) {
  return {
    ok: true,
    uid,

    nickname: profile.nickname || 'Cuenta no verificada',
    username: profile.nickname || 'Cuenta no verificada',

    region: profile.region || 'SAC',
    regionCode: profile.region || 'SAC',
    regionCountry: profile.region || 'SAC',

    creationDate: profile.creationDate || '',
    lastLogin: profile.lastLogin || '',
    accountAge: profile.accountAge || '',

    level: profile.level || '',
    exp: profile.exp || '',
    likes: Number(profile.likes || 0),

    gameVersion: profile.gameVersion || '',
    pass: profile.pass || '',
    booyahPass: profile.pass || '',

    clan: profile.clan || '',
    clanId: profile.clanId || '',
    clanLevel: profile.clanLevel || '',
    clanMembers: profile.clanMembers || '',

    bio: profile.bio || '',
    skinStatus: profile.skinStatus || '',
    skinError: profile.skinError || '',
    avatar: profile.avatar || '',
    banner: profile.banner || '',

    provider: profile.provider || 'FreeFireMania Fast',
    sourceUrl: profile.sourceUrl || '',
    cacheHit,
    savedToPrivateDb: cacheHit,

    sourceCount: 1,
    sourcesFound: [
      {
        provider: profile.provider || 'FreeFireMania Fast',
        sourceUrl: profile.sourceUrl || '',
      },
    ],

    diamonds: 0,
    diamondsConfirmed: false,
    primeLevel: '',
    primeConfirmed: false,
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function parseFreeFireManiaProfile(text, html) {
  const nickname =
    pick(text, [
      /Nick:\s*([^\n]+)/i,
      /Nombre:\s*([^\n]+)/i,
      /Jogador:\s*([^\n]+)/i,
      /Jugador:\s*([^\n]+)/i,
      /Informaci[oó]n de:\s*([^\n]+)/i,
      /Perfil del Jugador\s+([^\n]+)/i,
    ])

  const creationDate =
    pick(text, [
      /Cuenta creada el:\s*([^\n]+)/i,
      /Fecha de Creaci[oó]n:\s*([^\n]+)/i,
      /Data de cria[cç][aã]o:\s*([^\n]+)/i,
      /Criada em:\s*([^\n]+)/i,
    ])

  const lastLogin =
    pick(text, [
      /[UÚ]ltimo inicio de sesi[oó]n el:\s*([^\n]+)/i,
      /[UÚ]ltima vez online:\s*([^\n]+)/i,
      /[UÚ]ltimo login:\s*([^\n]+)/i,
      /[UÚ]ltimo acesso:\s*([^\n]+)/i,
    ])

  const gameVersion =
    pick(text, [
      /Versi[oó]n del juego:\s*([^\n]+)/i,
      /Version del juego:\s*([^\n]+)/i,
      /Vers[aã]o do jogo:\s*([^\n]+)/i,
    ])

  const level =
    pick(text, [
      /Nivel:\s*([0-9]+)/i,
      /N[ií]vel:\s*([0-9]+)/i,
      /Level:\s*([0-9]+)/i,
    ])

  const exp =
    pick(text, [
      /Exp:\s*([0-9.,]+)/i,
      /Experiencia:\s*([0-9.,]+)/i,
      /Experi[eê]ncia:\s*([0-9.,]+)/i,
    ])

  const likes =
    parseNumber(
      pick(text, [
        /Me gusta:\s*([0-9.,]+)/i,
        /Curtidas:\s*([0-9.,]+)/i,
        /Likes:\s*([0-9.,]+)/i,
      ]),
    )

  const pass =
    pick(text, [
      /Pase Booyah:\s*([^\n]+)/i,
      /Passe Booyah:\s*([^\n]+)/i,
      /Booyah Pass:\s*([^\n]+)/i,
    ])

  const region =
    pick(text, [
      /Regi[oó]n:\s*([^\n]+)/i,
      /Region:\s*([^\n]+)/i,
      /Regi[aã]o:\s*([^\n]+)/i,
    ])

  const clan =
    pick(text, [
      /Clan:\s*([^\n]+)/i,
      /Guilda:\s*([^\n]+)/i,
      /Cl[aã]:\s*([^\n]+)/i,
    ])

  const clanId =
    pick(text, [
      /Clan ID:\s*([0-9]+)/i,
      /ID del clan:\s*([0-9]+)/i,
      /Guild ID:\s*([0-9]+)/i,
      /ID da guilda:\s*([0-9]+)/i,
    ])

  const clanLevel =
    pick(text, [
      /Nivel de clan:\s*([0-9]+)/i,
      /N[ií]vel do cl[aã]:\s*([0-9]+)/i,
      /N[ií]vel da guilda:\s*([0-9]+)/i,
      /Nivel:\s*([0-9]+)\s*Miembros/i,
    ])

  const clanMembers =
    pick(text, [
      /Miembros:\s*([0-9]+)/i,
      /Membros:\s*([0-9]+)/i,
      /Integrantes:\s*([0-9]+)/i,
    ])

  const bio =
    cleanBio(
      pick(text, [
        /Biograf[ií]a:\s*([\s\S]*?)(?:Copiar|Perfil actualizado|Perfil atualizado|Antig[uü]edad|Otras herramientas|$)/i,
        /Bio:\s*([\s\S]*?)(?:Copiar|Perfil actualizado|Perfil atualizado|Antig[uü]edad|Otras herramientas|$)/i,
      ]),
    )

  const skinStatus =
    pick(text, [
      /Skin:\s*([^\n]+)/i,
    ]) ||
    (text.toLowerCase().includes('error al cargar la información de la skin')
      ? 'Error al cargar skin'
      : text.toLowerCase().includes('mostrar skin del jugador')
        ? 'Mostrar skin del jugador'
        : '')

  const skinError = text.toLowerCase().includes('error al cargar la información de la skin')
    ? 'Error al cargar la informacion de la skin.'
    : ''

  const avatar =
    normalizeUrl(
      pick(html, [
        /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|title)=["'][^"']*(?:Avatar|perfil|player|jugador)[^"']*["']/i,
        /(?:avatar|profile)[^"']*["']\s*src=["']([^"']+)["']/i,
      ]),
    )

  const banner =
    normalizeUrl(
      pick(html, [
        /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|title)=["'][^"']*(?:banner|profile)[^"']*["']/i,
      ]),
    )

  return {
    nickname: clean(nickname),
    region: clean(region) || 'SAC',
    creationDate: clean(creationDate),
    lastLogin: clean(lastLogin),
    gameVersion: clean(gameVersion),
    level: clean(level),
    exp: clean(exp),
    likes,
    pass: clean(pass),
    clan: clean(clan),
    clanId: clean(clanId),
    clanLevel: clean(clanLevel),
    clanMembers: clean(clanMembers),
    bio,
    skinStatus: clean(skinStatus),
    skinError,
    avatar,
    banner,
  }
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/h1>|<\/h2>|<\/h3>|<\/section>|<\/article>|<\/tr>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, ': ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

function pick(value, patterns) {
  for (const pattern of patterns) {
    const match = String(value || '').match(pattern)

    if (match?.[1]) {
      return match[1]
        .replace(/\s+/g, ' ')
        .trim()
    }
  }

  return ''
}

function parseNumber(value) {
  return Number(String(value || '').replace(/[^\d]/g, '') || 0)
}

function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/Copiar código de Biografía/i, '')
    .replace(/¡Biografía Copiada!/i, '')
    .trim()
}

function cleanBio(value) {
  return clean(value)
    .replace(/Perfil actualizado el:.*/i, '')
    .replace(/Perfil atualizado em:.*/i, '')
    .trim()
}

function normalizeUrl(value) {
  const cleaned = clean(value)
  if (!cleaned) return ''

  try {
    return new URL(cleaned, 'https://www.freefiremania.com.br').toString()
  } catch {
    return ''
  }
}

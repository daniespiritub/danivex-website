export const scannerRegions = [
  { value: 'auto', label: 'Autodetectar region' },
  { value: 'south-america', label: 'Sudamerica' },
  { value: 'north-america', label: 'Norteamerica' },
  { value: 'europe', label: 'Europa' },
  { value: 'brazil', label: 'Brazil' },
  { value: 'latam-north', label: 'Latinoamerica Norte' },
]

export const primeLevels = [
  { level: 1, points: 100, diamonds: 100, privileges: ['Avatar y Banner Iniciante Prime', 'Simbolo Prime 1', 'Estatus Prime inicial'] },
  { level: 2, points: 1000, diamonds: 1000, privileges: ['Regalos Exclusivos', 'Lista de Bloqueos Ampliada', 'Simbolo Prime 2'] },
  { level: 3, points: 3000, diamonds: 3000, privileges: ['Pared de Gel - Honor del Prime', 'Espacio Extra para Traje', 'Simbolo Prime 3'] },
  { level: 4, points: 10000, diamonds: 10000, privileges: ['Emote Habla Mas Fuerte', 'Avatar y Banner Avance del Prime', '+100 Espacios para Amigos', 'Simbolo Prime 4'] },
  { level: 5, points: 30000, diamonds: 30000, privileges: ['Apodo Colorido', 'Invitacion Prime', 'Simbolo Prime 5'] },
  { level: 6, points: 60000, diamonds: 60000, privileges: ['Animacion de Perfil Prime', 'Perfil Prime', 'Simbolo Prime 6'] },
  { level: 7, points: 120000, diamonds: 120000, privileges: ['Acceso Anticipado a Novedades', 'Tienda Prime Exclusiva', 'Avatar y Banner Maximo del Prime', 'Simbolo Prime 7'] },
  { level: 8, points: 200000, diamonds: 200000, privileges: ['Marco de Avatar Prime', 'Comparticion de Trajes', 'Insignia Prime', 'Simbolo Prime 8'] },
]

export const scannerSteps = [
  'Verificando formato UID...',
  'Buscando perfil publico...',
  'Extrayendo nickname y region...',
  'Leyendo fecha, nivel y actividad...',
  'Organizando datos publicos...',
  'Preparando analisis DaniVex...',
]

const statuses = ['Activa', 'Activa - Prime verificado', 'Activa - sin sanciones visibles', 'Activa - revision limpia']
const rarityLabels = ['Comun', 'Rara', 'Epica', 'Legendaria', 'Mitica']
const regionPriority = ['south-america', 'north-america', 'europe', 'brazil', 'latam-north']

const regionRules = [
  { code: 'south-america', label: 'Sudamerica', prefixes: ['1', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'] },
  { code: 'north-america', label: 'Norteamerica', prefixes: ['25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'] },
  { code: 'europe', label: 'Europa', prefixes: ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'] },
  { code: 'brazil', label: 'Brazil', prefixes: ['49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'] },
  { code: 'latam-north', label: 'Latinoamerica Norte', prefixes: ['61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72'] },
]

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function getPrimeLevelByPoints(points) {
  const safePoints = Number(points || 0)

  if (safePoints < primeLevels[0].points) {
    return {
      level: 0,
      points: 0,
      diamonds: 0,
      privileges: ['Sin Prime confirmado'],
    }
  }

  return primeLevels.reduce((current, level) => (safePoints >= level.points ? level : current), primeLevels[0])
}

export function getNextPrimeLevel(level) {
  return primeLevels.find((item) => item.level === Number(level || 0) + 1) || null
}

export function getPrimeProgress(diamonds) {
  const safeDiamonds = Math.max(0, Number(diamonds || 0))
  const current = getPrimeLevelByPoints(safeDiamonds)
  const next = getNextPrimeLevel(current.level)

  if (!next) {
    return {
      current,
      next: null,
      diamonds: safeDiamonds,
      missing: 0,
      percent: current.level >= 8 ? 100 : 0,
      isMax: current.level >= 8,
    }
  }

  const currentFloor = current.diamonds || 0
  const nextFloor = next.diamonds
  const range = Math.max(1, nextFloor - currentFloor)
  const progress = Math.max(0, safeDiamonds - currentFloor)

  return {
    current,
    next,
    diamonds: safeDiamonds,
    missing: Math.max(0, nextFloor - safeDiamonds),
    percent: Math.min(100, Math.round((progress / range) * 100)),
    isMax: false,
  }
}

export function getSpendingProfile(level) {
  if (level <= 0) return 'No confirmado'
  if (level <= 2) return 'Prime inicial'
  if (level <= 5) return 'Prime avanzado'
  if (level <= 7) return 'Prime elite'
  return 'Prime maximo'
}


export function detectRegionFromUid(uid, selectedRegion = 'auto') {
  const cleanUid = normalizeUid(uid)
  const forcedRegion = scannerRegions.find((item) => item.value === selectedRegion && item.value !== 'auto')

  if (forcedRegion) {
    return {
      code: forcedRegion.value,
      label: forcedRegion.label,
      confidence: 100,
      source: 'Seleccion manual',
    }
  }

  const prefix2 = cleanUid.slice(0, 2)
  const prefix1 = cleanUid.slice(0, 1)
  const directRule = regionRules.find((rule) => rule.prefixes.includes(prefix2) || rule.prefixes.includes(prefix1))

  if (directRule) {
    return {
      code: directRule.code,
      label: directRule.label,
      confidence: cleanUid.length >= 8 ? 78 : 62,
      source: 'Autodetectada por UID',
    }
  }

  const numericUid = Number(cleanUid || 0)
  const code = regionPriority[numericUid % regionPriority.length]
  const fallback = scannerRegions.find((item) => item.value === code)

  return {
    code,
    label: fallback?.label || 'Sudamerica',
    confidence: 54,
    source: 'Autodetectada por patron mock',
  }
}

export function generateAIAnalysis(playerData) {
  if (playerData.lookupStatus !== 'real') {
    return 'No se encontro un perfil publico para este UID. DaniVex no inventa nickname, region, diamantes ni nivel Prime.'
  }

  const details = [
    `Perfil publico detectado para ${playerData.username}.`,
    `UID ${playerData.uid} con region ${playerData.region}.`,
  ]

  if (playerData.creationDate) details.push(`La cuenta registra fecha de creacion: ${playerData.creationDate}.`)
  if (playerData.lastLogin) details.push(`Ultimo inicio de sesion publicado: ${playerData.lastLogin}.`)
  if (playerData.level) details.push(`Nivel publicado: ${playerData.level}${playerData.exp ? ` con EXP ${playerData.exp}` : ''}.`)
  if (playerData.likes) details.push(`Tiene ${formatNumber(playerData.likes)} me gusta.`)

  if (playerData.prime.diamonds > 0) {
    const nextRead = playerData.prime.next
      ? `Le faltan ${formatNumber(playerData.prime.missing)} diamantes para Prime ${playerData.prime.next.level}.`
      : 'Ya esta en Prime 8, que es el nivel maximo.'

    details.push(`Prime calculado con tabla FreeFireJornal: Prime ${playerData.prime.level} con ${formatNumber(playerData.prime.diamonds)} diamantes confirmados. ${nextRead}`)
  } else {
    details.push('La fuente publica no confirma diamantes comprados; por eso DaniVex no calcula Prime inventado.')
  }

  details.push(`Fuente usada: ${playerData.lookupProvider}.`)
  details.push('Los datos no publicados por la fuente aparecen como no disponibles.')

  return details.join(' ')
}

export function generateMockPlayer(uid, selectedRegion, accountName = '') {
  const cleanUid = normalizeUid(uid)
  const exactAccountName = String(accountName || '').slice(0, 32)
  const hasAccountName = exactAccountName.trim().length > 0
  const seed = hashString(`${cleanUid}:${hasAccountName ? exactAccountName : 'no-name'}`)
  const regionDetection = detectRegionFromUid(cleanUid, selectedRegion)
  const baseLevelIndex = seed % primeLevels.length
  const baseLevel = primeLevels[baseLevelIndex]
  const nextLevel = getNextPrimeLevel(baseLevel.level)
  const levelCap = nextLevel?.points || 260000
  const room = Math.max(900, levelCap - baseLevel.points)
  const points = Math.min(levelCap - 1, baseLevel.points + (seed % room))
  const primeLevel = getPrimeLevelByPoints(points)
  const creationYear = 2018 + (seed % 7)
  const creationMonth = seed % 12
  const creationDay = 1 + (seed % 27)
  const creationDate = new Date(Date.UTC(creationYear, creationMonth, creationDay))
  const ageMonths = getAccountAgeInMonths(creationDate)
  const rarity = Math.min(99, 28 + primeLevel.level * 7 + Math.floor(ageMonths / 7) + (seed % 9))
  const ogLevel = Math.min(10, Math.max(1, Math.round((ageMonths / 12) + primeLevel.level / 2)))

  const player = {
    uid: cleanUid || '123456789',
    username: hasAccountName ? exactAccountName : `UID ${cleanUid || '123456789'}`,
    nameSource: hasAccountName ? 'manual' : 'pending-api',
    avatarSeed: seed,
    region: regionDetection.label,
    regionCode: regionDetection.code,
    regionSource: regionDetection.source,
    regionConfidence: regionDetection.confidence,
    status: statuses[seed % statuses.length],
    creationDate: creationDate.toISOString(),
    accountAge: formatAccountAge(ageMonths),
    rarity,
    rarityLabel: rarityLabels[Math.min(rarityLabels.length - 1, Math.floor(rarity / 22))],
    ogLevel,
    spendingProfile: getSpendingProfile(primeLevel.level),
    prime: {
      level: primeLevel.level,
      points,
      diamonds: points,
      currentFloor: primeLevel.points,
      next: getNextPrimeLevel(primeLevel.level),
    },
  }

  return {
    ...player,
    aiAnalysis: generateAIAnalysis(player),
  }
}

export function generatePlayerFromLookup(uid, lookup) {
  const cleanUid = normalizeUid(uid)

  const hasRealData =
    lookup &&
    lookup.ok &&
    lookup.nickname

  const confirmedDiamonds = Number(lookup?.diamonds || lookup?.rechargedDiamonds || 0)
  const primeProgress = getPrimeProgress(confirmedDiamonds)

  const player = {
    uid: cleanUid,

    username: hasRealData
      ? lookup.nickname
      : 'Cuenta no verificada',

    nameSource: hasRealData
      ? lookup.provider || 'public-profile'
      : 'not-verified',

    lookupStatus: hasRealData
      ? 'real'
      : 'not_verified',

    lookupMessage: hasRealData
      ? ''
      : lookup?.message || 'No se encontro perfil publico para este UID.',

    lookupProvider:
      lookup?.provider ||
      'Perfil publico',

    sourceUrl: lookup?.sourceUrl || '',
    sourcesFound: lookup?.sourcesFound || [],
    sourceCount: lookup?.sourceCount || 0,
    fieldSources: lookup?.fieldSources || {},
    cacheHit: Boolean(lookup?.cacheHit),
    savedToPrivateDb: Boolean(lookup?.savedToPrivateDb),

    avatarUrl: hasRealData
      ? (lookup.avatar || '')
      : '',

    bannerUrl: hasRealData
      ? (lookup.banner || '')
      : '',

    avatarSeed: 0,

    region: hasRealData
      ? (lookup.region || 'No disponible')
      : 'Desconocida',

    regionCode: lookup?.regionCode || 'unknown',

    regionCountry: lookup?.regionCountry || '',

    regionSource: hasRealData
      ? lookup.provider || 'Fuente publica'
      : 'NO_VERIFIED',

    regionConfidence: hasRealData && lookup.region
      ? 100
      : 0,

    status: hasRealData
      ? 'Perfil publico encontrado'
      : 'UID sin perfil publico',

    creationDate: lookup?.creationDate || null,
    lastLogin: lookup?.lastLogin || null,
    accountAge: lookup?.accountAge || 'No disponible',
    level: lookup?.level || '',
    exp: lookup?.exp || '',
    likes: lookup?.likes || 0,
    gameVersion: lookup?.gameVersion || '',
    pass: lookup?.pass || '',
    clan: lookup?.clan || '',
    bio: lookup?.bio || '',
    skinStatus: lookup?.skinStatus || '',
    skinError: lookup?.skinError || '',

    rarity: 0,
    rarityLabel: 'Datos publicos',
    ogLevel: 0,
    spendingProfile: getSpendingProfile(primeProgress.current.level),

    prime: {
      level: primeProgress.current.level,
      points: confirmedDiamonds,
      diamonds: confirmedDiamonds,
      currentFloor: primeProgress.current.diamonds,
      next: primeProgress.next,
      missing: primeProgress.missing,
      percent: primeProgress.percent,
      isMax: primeProgress.isMax,
      source: confirmedDiamonds > 0 ? 'FreeFireJornal / fuente publica' : 'No confirmado',
    },
  }

  return {
    ...player,
    aiAnalysis: hasRealData
      ? generateAIAnalysis(player)
      : 'No hay datos publicos suficientes para generar un analisis confiable.',
  }
}
export function normalizeUid(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 14)
}

function hashString(value) {
  return [...value].reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.codePointAt(0)
    return Math.abs(nextHash | 0)
  }, 5381)
}

function buildPrime(seed) {
  const baseLevelIndex = seed % primeLevels.length
  const baseLevel = primeLevels[baseLevelIndex]
  const nextLevel = getNextPrimeLevel(baseLevel.level)
  const levelCap = nextLevel?.points || 260000
  const room = Math.max(900, levelCap - baseLevel.points)
  const points = Math.min(levelCap - 1, baseLevel.points + (seed % room))
  const primeLevel = getPrimeLevelByPoints(points)

  return {
    level: primeLevel.level,
    points,
    diamonds: points,
    currentFloor: primeLevel.points,
    next: getNextPrimeLevel(primeLevel.level),
  }
}

function buildCreationDate(seed) {
  const creationYear = 2018 + (seed % 7)
  const creationMonth = seed % 12
  const creationDay = 1 + (seed % 27)
  return new Date(Date.UTC(creationYear, creationMonth, creationDay))
}

function getAccountAgeInMonths(date) {
  const now = new Date()
  return Math.max(1, (now.getFullYear() - date.getUTCFullYear()) * 12 + now.getMonth() - date.getUTCMonth())
}

function formatAccountAge(totalMonths) {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years <= 0) return `${months} meses`
  if (months === 0) return `${years} anos`
  return `${years} anos, ${months} meses`
}

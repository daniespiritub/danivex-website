export const scannerRegions = [
  { value: 'auto', label: 'Autodetectar region' },
  { value: 'south-america', label: 'Sudamerica' },
  { value: 'north-america', label: 'Norteamerica' },
  { value: 'europe', label: 'Europa' },
  { value: 'brazil', label: 'Brazil' },
  { value: 'latam-north', label: 'Latinoamerica Norte' },
]

export const primeLevels = [
  { level: 1, points: 100, diamonds: 100, privileges: ['Acceso Prime inicial', 'Insignia basica', 'Recompensas de recarga'] },
  { level: 2, points: 1000, diamonds: 1000, privileges: ['Recompensas Prime mejoradas', 'Mayor prioridad de eventos', 'Insignia Prime 2'] },
  { level: 3, points: 3000, diamonds: 3000, privileges: ['Beneficios avanzados', 'Mayor progreso Prime', 'Insignia Prime 3'] },
  { level: 4, points: 10000, diamonds: 10000, privileges: ['Privilegios superiores', 'Recompensas de mayor valor', 'Insignia Prime 4'] },
  { level: 5, points: 30000, diamonds: 30000, privileges: ['Estado Prime avanzado', 'Recompensas premium', 'Insignia Prime 5'] },
  { level: 6, points: 60000, diamonds: 60000, privileges: ['Privilegios legendarios', 'Perfil de alta inversion', 'Insignia Prime 6'] },
  { level: 7, points: 120000, diamonds: 120000, privileges: ['Acceso Prime elite', 'Recompensas top', 'Insignia Prime 7'] },
  { level: 8, points: 200000, diamonds: 200000, privileges: ['Maximo rango Prime', 'Privilegios elite completos', 'Insignia Prime 8'] },
]

export const scannerSteps = [
  'Verificando UID...',
  'Leyendo nombre de cuenta...',
  'Autodetectando region...',
  'Consultando estado Prime...',
  'Calculando diamantes...',
  'Generando analisis IA...',
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
  return primeLevels.reduce((current, level) => (points >= level.points ? level : current), primeLevels[0])
}

export function getNextPrimeLevel(level) {
  return primeLevels.find((item) => item.level === level + 1) || null
}

export function getSpendingProfile(level) {
  if (level <= 2) return 'Casual Prime'
  if (level <= 5) return 'Advanced Prime'
  return 'Legendary Prime'
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
  const investment = playerData.prime.level >= 6 ? 'alta' : playerData.prime.level >= 3 ? 'media' : 'ligera'
  const rarityRead = playerData.rarity >= 80 ? 'muy superior al promedio' : playerData.rarity >= 55 ? 'competitiva' : 'en crecimiento'
  const ogRead = playerData.ogLevel >= 7 ? 'con perfil OG fuerte' : playerData.ogLevel >= 4 ? 'con senales OG moderadas' : 'todavia joven dentro del ecosistema'
  const nameRead = playerData.nameSource === 'manual'
    ? `El nombre visible analizado es "${playerData.username}", respetando mayusculas, espacios y simbolos ingresados.`
    : 'El nombre real aun no esta conectado a API; no se invento otro username para evitar confundir cuentas.'

  return [
    nameRead,
    `Esta cuenta aparece como Prime activo con inversion ${investment} dentro de Free Fire.`,
    `Su Prime Level ${playerData.prime.level} y sus ${formatNumber(playerData.prime.points)} Prime Points indican una cuenta ${rarityRead}.`,
    `La region ${playerData.region} fue marcada como ${playerData.regionSource.toLowerCase()} con ${playerData.regionConfidence}% de confianza mock.`,
    `Por antiguedad estimada y estado ${playerData.status.toLowerCase()}, el sistema la clasifica ${ogRead}.`,
  ].join(' ')
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

export function normalizeUid(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 14)
}

function hashString(value) {
  return [...value].reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.codePointAt(0)
    return Math.abs(nextHash | 0)
  }, 5381)
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

export const scannerRegions = [
  { value: 'auto', label: 'Detectar region' },
  { value: 'latam', label: 'LATAM' },
  { value: 'br', label: 'Brasil' },
  { value: 'na', label: 'Norteamerica' },
  { value: 'eu', label: 'Europa' },
  { value: 'ind', label: 'India' },
  { value: 'sg', label: 'Singapore' },
  { value: 'me', label: 'MENA' },
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
  'Buscando jugador...',
  'Detectando region...',
  'Consultando estado Prime...',
  'Calculando diamantes...',
  'Generando analisis IA...',
]

const mockNames = [
  '꧁༒DaniVex༒꧂',
  'ＤＡＮＩ 亗 PRIME',
  '☆ ʙᴘᴇ Gaming ☆',
  'MᴀsʜᴇsᴘㅤFF',
  '亗 Prime Hunter 亗',
  'Dani VeXㅤAI',
  'ꜰꜰㅤLegendary',
  'OGㅤDaniVex!',
]

const statuses = ['Activa', 'Activa - Prime verificado', 'Activa - sin sanciones visibles', 'Activa - revision limpia']
const rarityLabels = ['Comun', 'Rara', 'Epica', 'Legendaria', 'Mitica']
const regionFallback = ['LATAM', 'Brasil', 'Norteamerica', 'Europa', 'Singapore', 'MENA']

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

export function generateAIAnalysis(playerData) {
  const investment = playerData.prime.level >= 6 ? 'alta' : playerData.prime.level >= 3 ? 'media' : 'ligera'
  const rarityRead = playerData.rarity >= 80 ? 'muy superior al promedio' : playerData.rarity >= 55 ? 'competitiva' : 'en crecimiento'
  const ogRead = playerData.ogLevel >= 7 ? 'con perfil OG fuerte' : playerData.ogLevel >= 4 ? 'con senales OG moderadas' : 'todavia joven dentro del ecosistema'

  return [
    `Esta cuenta pertenece a un jugador Prime activo con inversion ${investment} dentro de Free Fire.`,
    `Su Prime Level ${playerData.prime.level} y sus ${formatNumber(playerData.prime.points)} Prime Points indican una cuenta ${rarityRead}.`,
    `Por antiguedad estimada, region ${playerData.region} y estado ${playerData.status.toLowerCase()}, el sistema la clasifica ${ogRead}.`,
    `El UID ${playerData.uid} mantiene una lectura mock lista para conectarse a APIs reales cuando activemos la siguiente fase.`,
  ].join(' ')
}

export function generateMockPlayer(uid, selectedRegion) {
  const cleanUid = uid.trim()
  const seed = hashString(cleanUid || 'danivex')
  const region = selectedRegion === 'auto'
    ? regionFallback[seed % regionFallback.length]
    : scannerRegions.find((item) => item.value === selectedRegion)?.label || 'LATAM'
  const baseLevelIndex = seed % primeLevels.length
  const baseLevel = primeLevels[baseLevelIndex]
  const nextLevel = getNextPrimeLevel(baseLevel.level)
  const levelCap = nextLevel?.points || 260000
  const room = Math.max(900, levelCap - baseLevel.points)
  const points = Math.min(levelCap - 1, baseLevel.points + (seed % room))
  const primeLevel = getPrimeLevelByPoints(points)
  const creationYear = 2018 + (seed % 7)
  const creationMonth = (seed % 12)
  const creationDay = 1 + (seed % 27)
  const creationDate = new Date(Date.UTC(creationYear, creationMonth, creationDay))
  const ageMonths = getAccountAgeInMonths(creationDate)
  const rarity = Math.min(99, 28 + primeLevel.level * 7 + Math.floor(ageMonths / 7) + (seed % 9))
  const ogLevel = Math.min(10, Math.max(1, Math.round((ageMonths / 12) + primeLevel.level / 2)))
  const username = mockNames[seed % mockNames.length]

  const player = {
    uid: cleanUid || '123456789',
    username,
    avatarSeed: seed,
    region,
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

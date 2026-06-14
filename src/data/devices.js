import { androidDeviceBrands, androidDeviceCatalogMeta, androidDeviceRows } from './androidDevices.generated.js'

export const tierLabels = {
  entry: 'Entrada',
  budget: 'Media baja',
  mid: 'Media',
  upper: 'Media alta',
  flagship: 'Flagship',
  gaming: 'Gaming',
  tablet: 'Tablet',
  ipad: 'iPad',
}

export const sources = [
  { name: 'Apple Support', url: 'https://support.apple.com/es-es/108044' },
  { name: 'Samsung Galaxy', url: 'https://www.samsung.com/us/smartphones/galaxy-s26/' },
  { name: 'REDMAGIC', url: 'https://redmagic.tech/products/redmagic-11-pro' },
  { name: 'Xiaomi Pad', url: 'https://www.mi.com/global/product/xiaomi-pad-7/specs/' },
]

function inferDefaultDpi({ name, os, type, tier, screen }) {
  if (os === 'iOS') return name.includes('SE') || name.includes('8') ? 326 : 460
  if (os === 'iPadOS') return 264
  if (type === 'tablet') return Number(screen) >= 12 ? 320 : 360
  if (tier === 'entry') return 320
  if (tier === 'budget') return 360
  if (tier === 'mid') return 400
  if (tier === 'upper') return 420
  if (tier === 'flagship') return name.includes('Ultra') ? 500 : 480
  if (tier === 'gaming') return 480
  return 400
}

function device(name, brand, os, type, tier, hz, screen, aliases = []) {
  const defaultDpi = inferDefaultDpi({ name, os, type, tier, screen })

  return {
    name,
    model: name,
    brand,
    os,
    type,
    tier,
    hz,
    screen,
    defaultDpi,
    estimatedDpi: defaultDpi,
    aliases,
    search: [name, brand, os, type, tier, defaultDpi, ...aliases].join(' ').toLowerCase(),
  }
}

function generatedAndroidDevice(row) {
  const [brandIndex, model, tierCode, typeCode] = row
  const brand = androidDeviceBrands[brandIndex] || 'Android'
  const type = typeCode === 1 ? 'tablet' : 'phone'
  const tier = ['entry', 'budget', 'mid', 'upper', 'flagship', 'gaming', 'tablet'][tierCode] || 'mid'
  const estimatedDpi = generatedEstimatedDpi(tier, type)
  const hz = estimateHz(tier, type)
  const screen = estimateScreen(type)

  return {
    name: model,
    model,
    brand,
    os: 'Android',
    type,
    tier,
    hz,
    screen,
    defaultDpi: estimatedDpi,
    estimatedDpi,
    aliases: [],
    source: androidDeviceCatalogMeta.source,
    search: [brand, model, 'Android', type, tier, estimatedDpi].join(' ').toLowerCase(),
  }
}

function generatedEstimatedDpi(tier, type) {
  if (type === 'tablet') return 360
  const dpiByTier = {
    entry: 320,
    budget: 360,
    mid: 400,
    upper: 420,
    flagship: 480,
    gaming: 480,
  }
  return dpiByTier[tier] || 400
}

function estimateHz(tier, type) {
  if (tier === 'gaming') return 144
  if (tier === 'flagship' || tier === 'upper') return 120
  if (tier === 'mid' || tier === 'budget' || type === 'tablet') return 90
  return 60
}

function estimateScreen(type) {
  return type === 'tablet' ? '11' : '6.5'
}

function dedupeDevices(list) {
  const seen = new Set()

  return list.filter((item) => {
    const key = `${item.brand}|${item.model}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function samsungGalaxyS() {
  const rows = [
    ['Galaxy S8', 'flagship', 60, '5.8', ['SM-G950']],
    ['Galaxy S8+', 'flagship', 60, '6.2', ['SM-G955']],
    ['Galaxy S9', 'flagship', 60, '5.8', ['SM-G960']],
    ['Galaxy S9+', 'flagship', 60, '6.2', ['SM-G965']],
    ['Galaxy S10e', 'flagship', 60, '5.8', ['SM-G970']],
    ['Galaxy S10', 'flagship', 60, '6.1', ['SM-G973']],
    ['Galaxy S10+', 'flagship', 60, '6.4', ['SM-G975']],
    ['Galaxy S20', 'flagship', 120, '6.2', ['SM-G980']],
    ['Galaxy S20+', 'flagship', 120, '6.7', ['SM-G985']],
    ['Galaxy S20 Ultra', 'flagship', 120, '6.9', ['SM-G988']],
    ['Galaxy S21', 'flagship', 120, '6.2', ['SM-G991']],
    ['Galaxy S21+', 'flagship', 120, '6.7', ['SM-G996']],
    ['Galaxy S21 Ultra', 'flagship', 120, '6.8', ['SM-G998']],
    ['Galaxy S21 FE', 'upper', 120, '6.4', ['SM-G990']],
    ['Galaxy S22', 'flagship', 120, '6.1', ['SM-S901']],
    ['Galaxy S22+', 'flagship', 120, '6.6', ['SM-S906']],
    ['Galaxy S22 Ultra', 'flagship', 120, '6.8', ['SM-S908']],
    ['Galaxy S23', 'flagship', 120, '6.1', ['SM-S911']],
    ['Galaxy S23+', 'flagship', 120, '6.6', ['SM-S916']],
    ['Galaxy S23 Ultra', 'flagship', 120, '6.8', ['SM-S918']],
    ['Galaxy S23 FE', 'upper', 120, '6.4', ['SM-S711']],
    ['Galaxy S24', 'flagship', 120, '6.2', ['SM-S921']],
    ['Galaxy S24+', 'flagship', 120, '6.7', ['SM-S926']],
    ['Galaxy S24 Ultra', 'flagship', 120, '6.8', ['SM-S928']],
    ['Galaxy S24 FE', 'upper', 120, '6.7', ['SM-S721']],
    ['Galaxy S25', 'flagship', 120, '6.2', ['SM-S931']],
    ['Galaxy S25+', 'flagship', 120, '6.7', ['SM-S936']],
    ['Galaxy S25 Ultra', 'flagship', 120, '6.9', ['SM-S938']],
    ['Galaxy S25 FE', 'upper', 120, '6.7', ['SM-S731']],
    ['Galaxy S26', 'flagship', 120, '6.3', ['Galaxy AI']],
    ['Galaxy S26+', 'flagship', 120, '6.7', ['Galaxy AI']],
    ['Galaxy S26 Ultra', 'flagship', 120, '6.9', ['Galaxy AI']],
  ]
  return rows.map((row) => device(row[0], 'Samsung', 'Android', 'phone', row[1], row[2], row[3], row[4]))
}

function samsungGalaxyA() {
  const rows = [
    ['Galaxy A10', 'entry', 60, '6.2'], ['Galaxy A10s', 'entry', 60, '6.2'],
    ['Galaxy A20', 'entry', 60, '6.4'], ['Galaxy A20s', 'entry', 60, '6.5'],
    ['Galaxy A30', 'budget', 60, '6.4'], ['Galaxy A30s', 'budget', 60, '6.4'],
    ['Galaxy A40', 'budget', 60, '5.9'], ['Galaxy A50', 'mid', 60, '6.4'],
    ['Galaxy A50s', 'mid', 60, '6.4'], ['Galaxy A60', 'mid', 60, '6.3'],
    ['Galaxy A70', 'mid', 60, '6.7'], ['Galaxy A80', 'upper', 60, '6.7'],
    ['Galaxy A90 5G', 'upper', 60, '6.7'], ['Galaxy A11', 'entry', 60, '6.4'],
    ['Galaxy A21s', 'entry', 60, '6.5'], ['Galaxy A31', 'budget', 60, '6.4'],
    ['Galaxy A41', 'budget', 60, '6.1'], ['Galaxy A51', 'mid', 60, '6.5'],
    ['Galaxy A71', 'mid', 60, '6.7'], ['Galaxy A02', 'entry', 60, '6.5'],
    ['Galaxy A12', 'entry', 60, '6.5'], ['Galaxy A22', 'budget', 90, '6.4'],
    ['Galaxy A32', 'budget', 90, '6.4'], ['Galaxy A42 5G', 'mid', 60, '6.6'],
    ['Galaxy A52', 'mid', 90, '6.5'], ['Galaxy A52s', 'mid', 120, '6.5'],
    ['Galaxy A72', 'mid', 90, '6.7'], ['Galaxy A03', 'entry', 60, '6.5'],
    ['Galaxy A13', 'entry', 60, '6.6'], ['Galaxy A23', 'budget', 90, '6.6'],
    ['Galaxy A33 5G', 'mid', 90, '6.4'], ['Galaxy A53 5G', 'mid', 120, '6.5'],
    ['Galaxy A73 5G', 'upper', 120, '6.7'], ['Galaxy A04', 'entry', 60, '6.5'],
    ['Galaxy A14 5G', 'entry', 90, '6.6'], ['Galaxy A24', 'budget', 90, '6.5'],
    ['Galaxy A34 5G', 'mid', 120, '6.6'], ['Galaxy A54 5G', 'mid', 120, '6.4'],
    ['Galaxy A05', 'entry', 60, '6.7'], ['Galaxy A15 5G', 'budget', 90, '6.5', ['SM-A156']],
    ['Galaxy A25 5G', 'mid', 120, '6.5'], ['Galaxy A35 5G', 'mid', 120, '6.6'],
    ['Galaxy A55 5G', 'upper', 120, '6.6'], ['Galaxy A16 5G', 'budget', 90, '6.7', ['SM-A166']],
    ['Galaxy A17 5G', 'budget', 90, '6.7', ['SM-A176']], ['Galaxy A26 5G', 'mid', 120, '6.7', ['SM-A266']],
    ['Galaxy A36 5G', 'mid', 120, '6.7', ['SM-A366']], ['Galaxy A56 5G', 'upper', 120, '6.7', ['SM-A566']],
  ]
  return rows.map((row) => device(row[0], 'Samsung', 'Android', 'phone', row[1], row[2], row[3], row[4] || []))
}

function iphoneModels() {
  const rows = [
    ['iPhone 8', 'mid', 60, '4.7'], ['iPhone 8 Plus', 'mid', 60, '5.5'],
    ['iPhone X', 'upper', 60, '5.8'], ['iPhone XR', 'upper', 60, '6.1'],
    ['iPhone XS', 'upper', 60, '5.8'], ['iPhone XS Max', 'upper', 60, '6.5'],
    ['iPhone 11', 'upper', 60, '6.1'], ['iPhone 11 Pro', 'flagship', 60, '5.8'],
    ['iPhone 11 Pro Max', 'flagship', 60, '6.5'], ['iPhone SE 2', 'mid', 60, '4.7'],
    ['iPhone 12 mini', 'upper', 60, '5.4'], ['iPhone 12', 'upper', 60, '6.1'],
    ['iPhone 12 Pro', 'flagship', 60, '6.1'], ['iPhone 12 Pro Max', 'flagship', 60, '6.7'],
    ['iPhone 13 mini', 'upper', 60, '5.4'], ['iPhone 13', 'upper', 60, '6.1'],
    ['iPhone 13 Pro', 'flagship', 120, '6.1'], ['iPhone 13 Pro Max', 'flagship', 120, '6.7'],
    ['iPhone SE 3', 'mid', 60, '4.7'], ['iPhone 14', 'upper', 60, '6.1'],
    ['iPhone 14 Plus', 'upper', 60, '6.7'], ['iPhone 14 Pro', 'flagship', 120, '6.1'],
    ['iPhone 14 Pro Max', 'flagship', 120, '6.7'], ['iPhone 15', 'upper', 60, '6.1'],
    ['iPhone 15 Plus', 'upper', 60, '6.7'], ['iPhone 15 Pro', 'flagship', 120, '6.1'],
    ['iPhone 15 Pro Max', 'flagship', 120, '6.7'], ['iPhone 16', 'upper', 60, '6.1'],
    ['iPhone 16 Plus', 'upper', 60, '6.7'], ['iPhone 16 Pro', 'flagship', 120, '6.3'],
    ['iPhone 16 Pro Max', 'flagship', 120, '6.9'], ['iPhone 16e', 'upper', 60, '6.1'],
    ['iPhone 17', 'flagship', 120, '6.3'], ['iPhone Air', 'flagship', 120, '6.5'],
    ['iPhone 17 Pro', 'flagship', 120, '6.3'], ['iPhone 17 Pro Max', 'flagship', 120, '6.9'],
  ]
  return rows.map((row) => device(row[0], 'Apple', 'iOS', 'phone', row[1], row[2], row[3], ['iOS']))
}

function tabletModels() {
  const rows = [
    ['iPad 6th gen', 'ipad', 60, '9.7', 'Apple', 'iPadOS'],
    ['iPad 7th gen', 'ipad', 60, '10.2', 'Apple', 'iPadOS'],
    ['iPad 8th gen', 'ipad', 60, '10.2', 'Apple', 'iPadOS'],
    ['iPad 9th gen', 'ipad', 60, '10.2', 'Apple', 'iPadOS'],
    ['iPad 10th gen', 'ipad', 60, '10.9', 'Apple', 'iPadOS'],
    ['iPad mini 5', 'ipad', 60, '7.9', 'Apple', 'iPadOS'],
    ['iPad mini 6', 'ipad', 60, '8.3', 'Apple', 'iPadOS'],
    ['iPad mini A17 Pro', 'ipad', 60, '8.3', 'Apple', 'iPadOS'],
    ['iPad Air M1', 'ipad', 60, '10.9', 'Apple', 'iPadOS'],
    ['iPad Air M2 11', 'ipad', 60, '11', 'Apple', 'iPadOS'],
    ['iPad Air M2 13', 'ipad', 60, '13', 'Apple', 'iPadOS'],
    ['iPad Pro 11 M2', 'ipad', 120, '11', 'Apple', 'iPadOS'],
    ['iPad Pro 12.9 M2', 'ipad', 120, '12.9', 'Apple', 'iPadOS'],
    ['iPad Pro 11 M4', 'ipad', 120, '11', 'Apple', 'iPadOS'],
    ['iPad Pro 13 M4', 'ipad', 120, '13', 'Apple', 'iPadOS'],
    ['Xiaomi Mi Pad 4', 'tablet', 60, '8', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 5', 'tablet', 120, '11', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 5 Pro', 'tablet', 120, '11', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 6', 'tablet', 144, '11', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 6 Pro', 'tablet', 144, '11', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 6 Max', 'tablet', 144, '14', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 6S Pro 12.4', 'tablet', 144, '12.4', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 7', 'tablet', 144, '11.2', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 7 Pro', 'tablet', 144, '11.2', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 7 Ultra', 'tablet', 120, '14', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 7S Pro', 'tablet', 144, '12.5', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 8', 'tablet', 144, '11.2', 'Xiaomi', 'Android'],
    ['Xiaomi Pad 8 Pro', 'tablet', 144, '11.2', 'Xiaomi', 'Android'],
    ['Redmi Pad', 'tablet', 90, '10.6', 'Xiaomi', 'Android'],
    ['Redmi Pad SE', 'tablet', 90, '11', 'Xiaomi', 'Android'],
    ['Redmi Pad Pro', 'tablet', 120, '12.1', 'Xiaomi', 'Android'],
  ]
  return rows.map((row) => device(row[0], row[4], row[5], 'tablet', row[1], row[2], row[3], [row[4], row[5]]))
}

function gamingPhones() {
  const rows = [
    ['RedMagic 3', 90, '6.65'], ['RedMagic 3S', 90, '6.65'],
    ['RedMagic 5G', 144, '6.65'], ['RedMagic 5S', 144, '6.65'],
    ['RedMagic 6', 165, '6.8'], ['RedMagic 6 Pro', 165, '6.8'],
    ['RedMagic 6R', 144, '6.67'], ['RedMagic 6S Pro', 165, '6.8'],
    ['RedMagic 7', 165, '6.8'], ['RedMagic 7 Pro', 120, '6.8'],
    ['RedMagic 7S Pro', 120, '6.8'], ['RedMagic 8 Pro', 120, '6.8'],
    ['RedMagic 8S Pro', 120, '6.8'], ['RedMagic 9 Pro', 120, '6.8'],
    ['RedMagic 9S Pro', 120, '6.8'], ['RedMagic 10 Pro', 144, '6.85'],
    ['RedMagic 10 Pro+', 144, '6.85'], ['RedMagic 10S Pro', 144, '6.85'],
    ['RedMagic Nova Tablet', 144, '10.9'], ['RedMagic 11 Pro', 144, '6.85'],
    ['ROG Phone 7', 165, '6.78'], ['ROG Phone 8', 165, '6.78'],
    ['ROG Phone 9', 185, '6.78'], ['Black Shark 5 Pro', 144, '6.67'],
  ]
  return rows.map((row) => {
    const isTablet = row[0].toLowerCase().includes('tablet')
    const brand = row[0].startsWith('ROG') ? 'ASUS' : row[0].startsWith('Black') ? 'Black Shark' : 'REDMAGIC'
    return device(row[0], brand, 'Android', isTablet ? 'tablet' : 'phone', 'gaming', row[1], row[2], ['gaming phone'])
  })
}

const curatedDevices = [
  ...iphoneModels(),
  ...samsungGalaxyA(),
  ...samsungGalaxyS(),
  ...tabletModels(),
  ...gamingPhones(),
]

export const manualTierOptions = [
  { value: 'entry', label: 'Gama baja', brand: 'Manual', model: 'Android gama baja', os: 'Android', type: 'phone', tier: 'entry', hz: 60, screen: '6.3', estimatedDpi: 320 },
  { value: 'mid', label: 'Gama media', brand: 'Manual', model: 'Android gama media', os: 'Android', type: 'phone', tier: 'mid', hz: 90, screen: '6.5', estimatedDpi: 400 },
  { value: 'upper', label: 'Gama media-alta', brand: 'Manual', model: 'Android gama media-alta', os: 'Android', type: 'phone', tier: 'upper', hz: 120, screen: '6.7', estimatedDpi: 420 },
  { value: 'flagship', label: 'Gama alta', brand: 'Manual', model: 'Android gama alta', os: 'Android', type: 'phone', tier: 'flagship', hz: 120, screen: '6.8', estimatedDpi: 480 },
  { value: 'gaming', label: 'Gaming', brand: 'Manual', model: 'Android gaming', os: 'Android', type: 'phone', tier: 'gaming', hz: 144, screen: '6.8', estimatedDpi: 480 },
  { value: 'iphone', label: 'iPhone', brand: 'Apple', model: 'iPhone manual', os: 'iOS', type: 'phone', tier: 'flagship', hz: 120, screen: '6.7', estimatedDpi: 460 },
]

export function createManualDevice(value = 'mid') {
  const option = manualTierOptions.find((item) => item.value === value) || manualTierOptions[1]

  return {
    name: option.model,
    model: option.model,
    brand: option.brand,
    os: option.os,
    type: option.type,
    tier: option.tier,
    hz: option.hz,
    screen: option.screen,
    defaultDpi: option.estimatedDpi,
    estimatedDpi: option.estimatedDpi,
    aliases: [option.label],
    isManual: true,
    manualTierValue: option.value,
    search: [option.brand, option.model, option.os, option.type, option.tier, option.label, option.estimatedDpi].join(' ').toLowerCase(),
  }
}

export const deviceCatalogMeta = {
  curatedRows: curatedDevices.length,
  generatedAndroidRows: androidDeviceCatalogMeta.generatedRows,
  source: androidDeviceCatalogMeta,
}

export const devices = dedupeDevices([
  ...curatedDevices,
  ...androidDeviceRows.map(generatedAndroidDevice),
]).sort((a, b) => a.name.localeCompare(b.name))

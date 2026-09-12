import test from 'node:test'
import assert from 'node:assert/strict'
import { preserveRichFields } from '../api/_lib/private-db.js'

// Simula: un snapshot rico (SiamBhau) ya guardado, y luego entra el proveedor
// keyless (sin datos ricos). NO se deben perder prime/rank/outfit/pet.
const richExisting = {
  nickname: 'DaniPepito', level: '85', likes: 24400,
  primeLevel: '8', rankBR: 'Gran Maestro', rankBRPoints: '3539',
  rankCS: 'Gran Maestro', rankCSPoints: '142', season: '53',
  pet: 'Palomita', petLevel: '7', badgeCount: '145',
  outfit: [{ id: '211000253' }, { id: '203053011' }],
  avatar: 'https://x/av.png', banner: 'https://x/bn.png',
}

test('preserveRichFields: keyless (rico vacio) NO borra los ricos previos', () => {
  const keyless = {
    nickname: 'DaniPepito', level: '85', likes: 24400,
    primeLevel: '', rankBR: '', rankBRPoints: '', rankCS: '', rankCSPoints: '',
    season: '', pet: '', petLevel: '', badgeCount: '', outfit: [],
    avatar: 'https://x/av.png', banner: 'https://x/bn.png',
  }
  const merged = preserveRichFields(richExisting, keyless)
  assert.equal(merged.primeLevel, '8')
  assert.equal(merged.rankBR, 'Gran Maestro')
  assert.equal(merged.rankBRPoints, '3539')
  assert.equal(merged.pet, 'Palomita')
  assert.equal(merged.outfit.length, 2)
  // CS NO se preserva: un CS antiguo sin verificar no debe resucitar (dato falso).
  assert.equal(merged.rankCS, '', 'rankCS NO debe preservarse desde el snapshot previo')
})

test('preserveRichFields: un valor rico NUEVO SI reemplaza al anterior', () => {
  const richer = { ...richExisting, primeLevel: '9', rankBR: 'Heroico' }
  const merged = preserveRichFields(richExisting, richer)
  assert.equal(merged.primeLevel, '9') // el dato nuevo manda
  assert.equal(merged.rankBR, 'Heroico')
})

test('preserveRichFields: RP LIVE mas nuevo GANA sobre el fixture/snapshot antiguo', () => {
  // El RP es dinamico: un valor live nuevo (3560) NUNCA es sobrescrito por el
  // snapshot antiguo (3539). Las observaciones antiguas son solo para regression.
  const oldSnap = { ...richExisting, rankBRPoints: '3539', rankBR: 'Heroico', rankBRDivision: 'I' }
  const liveNew = { ...richExisting, rankBRPoints: '3560', rankBR: 'Heroico', rankBRDivision: 'I', rankBRStarLevel: '1' }
  const merged = preserveRichFields(oldSnap, liveNew)
  assert.equal(merged.rankBRPoints, '3560', 'el RP live nuevo gana')
})

test('preserveRichFields: BR se preserva COMPLETO (RP + division/estrellas) en fallo transitorio', () => {
  const existing = { ...richExisting, rankBRPoints: '3560', rankBR: 'Heroico', rankBRDivision: 'I', rankBRStarLevel: '1', rankBRPointsToNext: '240' }
  const keylessFail = { nickname: 'DaniPepito', rankBR: '', rankBRPoints: '', rankBRDivision: '', rankBRStarLevel: '', rankBRPointsToNext: '' }
  const merged = preserveRichFields(existing, keylessFail)
  assert.equal(merged.rankBRPoints, '3560')
  assert.equal(merged.rankBRDivision, 'I', 'la division se preserva junto al RP (snapshot coherente)')
  assert.equal(merged.rankBRStarLevel, '1')
  assert.equal(merged.rankBRPointsToNext, '240')
})

test('preserveRichFields: proveedor RICO caido (429) => se conservan prime/BR/pet del ultimo snapshot bueno', () => {
  // Escenario real: SiamBhau agota su quota diaria (429) y solo responde el keyless
  // (nick/level/region/avatar/banner). El perfil servido NO debe degradar prime/BR/pet.
  const goodSnap = {
    nickname: 'X', level: '77', region: 'IND', avatar: 'a', banner: 'b',
    primeLevel: '7', rankBR: 'Diamante', rankBRDivision: 'IV', rankBRPoints: '3256',
    pet: 'Dreki', petNickname: '', petSkinName: '', clan: 'Survivors',
  }
  const keylessDegraded = {
    nickname: 'X', level: '77', region: 'IND', avatar: 'a', banner: 'b',
    primeLevel: '', rankBR: '', rankBRDivision: '', rankBRPoints: '', pet: '', clan: '',
  }
  const served = preserveRichFields(goodSnap, keylessDegraded)
  assert.equal(served.primeLevel, '7', 'Prime no se pierde por la caida del proveedor rico')
  assert.equal(served.rankBR, 'Diamante')
  assert.equal(served.rankBRDivision, 'IV')
  assert.equal(served.pet, 'Dreki')
  assert.equal(served.clan, 'Survivors')
})

test('preserveRichFields: sin snapshot previo devuelve el entrante tal cual', () => {
  const incoming = { primeLevel: '', outfit: [] }
  assert.deepEqual(preserveRichFields(null, incoming), incoming)
})

test('preserveRichFields: preserva outfit previo si el entrante llega vacio', () => {
  const merged = preserveRichFields(richExisting, { outfit: [] })
  assert.equal(merged.outfit.length, 2)
})

test('preserveRichFields: preserva stats si el endpoint de stats fallo (incoming sin stats)', () => {
  const existing = { ...richExisting, stats: { br: { solo: { matches: 714 } }, source: 'siambhau-stats' } }
  const merged = preserveRichFields(existing, { nickname: 'DaniPepito', stats: null })
  assert.ok(merged.stats && merged.stats.br.solo.matches === 714, 'stats buenas no se pierden por un fallo transitorio')
})

test('preserveRichFields: stats nuevas SI reemplazan a las previas', () => {
  const existing = { ...richExisting, stats: { br: { solo: { matches: 700 } } } }
  const merged = preserveRichFields(existing, { stats: { br: { solo: { matches: 720 } } } })
  assert.equal(merged.stats.br.solo.matches, 720)
})

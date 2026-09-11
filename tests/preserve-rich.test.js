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

test('preserveRichFields: sin snapshot previo devuelve el entrante tal cual', () => {
  const incoming = { primeLevel: '', outfit: [] }
  assert.deepEqual(preserveRichFields(null, incoming), incoming)
})

test('preserveRichFields: preserva outfit previo si el entrante llega vacio', () => {
  const merged = preserveRichFields(richExisting, { outfit: [] })
  assert.equal(merged.outfit.length, 2)
})

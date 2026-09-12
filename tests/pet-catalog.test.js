import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePet, petSpeciesName, petSkinName } from '../api/_lib/pet-catalog.js'

test('pet-catalog: petId => nombre de ESPECIE (nunca el id)', () => {
  assert.equal(petSpeciesName(1300000091), 'Falco')
  assert.equal(petSpeciesName('1300000091'), 'Falco')
  assert.equal(petSpeciesName(1300000001), 'Kitty')
  assert.equal(petSpeciesName(1300000041), 'Shiba')
})

test('pet-catalog: skinId => nombre del aspecto (sin prefijo "Pet skin:")', () => {
  assert.equal(petSkinName(1310000097), 'Blooming Falco')
  assert.doesNotMatch(petSkinName(1310000097), /Pet skin/i)
})

test('pet-catalog: resolvePet separa ESPECIE / APODO / ASPECTO (ground truth)', () => {
  const p = resolvePet({ id: 1300000091, name: 'Palomita', level: 7, skinId: 1310000097 })
  assert.equal(p.name, 'Falco', 'especie del petId')
  assert.equal(p.nickname, 'Palomita', 'el name de la API es el apodo del jugador')
  assert.equal(p.skinName, 'Blooming Falco', 'aspecto del skinId')
  assert.equal(p.level, '7')
  assert.doesNotMatch(p.name, /^\d+$/, 'NUNCA el id como nombre')
})

test('pet-catalog: sin apodo (name = especie o vacio) => nickname vacio', () => {
  const a = resolvePet({ id: 1300000041, name: 'Shiba' }) // name == especie
  assert.equal(a.name, 'Shiba')
  assert.equal(a.nickname, '')
  const b = resolvePet({ id: 1300000041 }) // sin name
  assert.equal(b.name, 'Shiba')
  assert.equal(b.nickname, '')
})

test('pet-catalog: name numerico (id) NUNCA se usa como nombre', () => {
  // Caso del bug: la API a veces trae name = id. La especie manda; si no hay
  // especie conocida, name queda '' (la UI muestra "Mascota desconocida"), NO el id.
  const known = resolvePet({ id: 1300000091, name: '1300000091' })
  assert.equal(known.name, 'Falco')
  assert.equal(known.nickname, '', 'un name numerico no es apodo')
  const unknown = resolvePet({ id: 1399999999, name: '1399999999' })
  assert.equal(unknown.name, '', 'especie desconocida + name numerico => sin nombre (no el id)')
})

test('pet-catalog: multiples especies conocidas resuelven por nombre', () => {
  for (const [id, name] of [[1300000091, 'Falco'], [1300000001, 'Kitty'], [1300000041, 'Shiba']]) {
    const r = resolvePet({ id })
    assert.equal(r.name, name)
    assert.doesNotMatch(r.name, /^\d+$/)
  }
})

// Regresion de la logica de Prime. Protege la semantica de TRES ESTADOS
// (confirmado / no encontrado / desconocido) exigida en PASO 10: la
// ausencia de datos NUNCA debe colapsarse en "Prime 0" demostrado.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrimeResponse, extractPrimeFromStaticText } from '../api/free-fire-prime.js'

test('extractPrimeFromStaticText: encuentra nivel+diamantes cuando el UID esta en el texto', () => {
  const text = 'blah 773872320 y luego nivel 7 con mas de 120.000 diamantes fin'
  const r = extractPrimeFromStaticText(text, '773872320')
  assert.equal(r.primeLevelNumber, 7)
  assert.equal(r.diamonds, 120000)
})

test('extractPrimeFromStaticText: UID ausente => sin nivel (no inventa)', () => {
  const text = 'este texto no menciona el uid buscado, nivel 8, 200.000 diamantes'
  const r = extractPrimeFromStaticText(text, '999999999')
  assert.equal(r.primeLevelNumber, 0)
  assert.equal(r.diamonds, 0)
})

test('buildPrimeResponse: nivel >= 1 => Prime CONFIRMADO', () => {
  const r = buildPrimeResponse('773872320', { primeLevelNumber: 7, diamonds: 120000 })
  assert.equal(r.primeConfirmed, true)
  assert.equal(r.primeLevel, 'Prime 7')
  assert.equal(r.nextPrimeLevel, 'Prime 8')
})

test('buildPrimeResponse: nivel 0 => NO confirmado (no es "Prime 0 demostrado")', () => {
  const r = buildPrimeResponse('123', { primeLevelNumber: 0, diamonds: 0 })
  assert.equal(r.primeConfirmed, false)
  // El contrato conserva primeLevel="Prime 0" pero primeConfirmed:false es
  // la señal de verdad: ausencia != Prime 0 real.
  assert.equal(r.diamondsConfirmed, false)
})

test('buildPrimeResponse: nivel maximo (8) marca MAX', () => {
  const r = buildPrimeResponse('123', { primeLevelNumber: 8, diamonds: 200000 })
  assert.equal(r.primeConfirmed, true)
  assert.equal(r.nextPrimeLevel, 'MAX')
  assert.equal(r.missingForNextPrime, 0)
})

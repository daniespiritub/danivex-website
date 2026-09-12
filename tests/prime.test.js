import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePrime } from '../api/_lib/prime.js'

test('prime: nivel 0 / vacio / null => sin insignia (no muestra badge adquirido)', () => {
  for (const v of [0, '', null, undefined, '0']) {
    const p = resolvePrime(v)
    assert.equal(p.active, false)
    assert.equal(p.level, 0)
    assert.equal(p.displayName, 'Sin Prime')
    assert.equal(p.emblemKey, '')
    assert.equal(p.tier, null)
  }
})

test('prime: niveles 1..8 => activo, emblema DISTINTO por nivel', () => {
  const keys = new Set()
  const colors = new Set()
  for (let n = 1; n <= 8; n += 1) {
    const p = resolvePrime(n)
    assert.equal(p.active, true)
    assert.equal(p.level, n)
    assert.equal(p.displayName, `Prime ${n}`)
    assert.equal(p.emblemKey, `prime-${n}`)
    assert.ok(p.tier && p.tier.c1, `Prime ${n} debe tener tier de color`)
    keys.add(p.emblemKey)
    colors.add(p.tier.c1)
  }
  assert.equal(keys.size, 8, 'cada nivel tiene emblemKey unico (nunca el mismo badge para todos)')
  assert.equal(colors.size, 8, 'cada nivel tiene color distinto')
})

test('prime: nivel fuera de rango => inactivo (no se inventa)', () => {
  assert.equal(resolvePrime(9).active, false)
  assert.equal(resolvePrime(99).active, false)
  assert.equal(resolvePrime(-1).active, false)
})

test('prime: string numerico se acepta ("8" => Prime 8)', () => {
  const p = resolvePrime('8')
  assert.equal(p.active, true)
  assert.equal(p.level, 8)
  assert.equal(p.emblemKey, 'prime-8')
})

test('prime: es funcion PURA del nivel (mismo nivel => mismo emblema; sin leakage por cuenta)', () => {
  // Prime 3 NUNCA resuelve al badge de Prime 8, y viceversa (evita "Prime 3 con badge 8").
  const a = resolvePrime(3)
  const b = resolvePrime(8)
  assert.equal(a.emblemKey, 'prime-3')
  assert.equal(b.emblemKey, 'prime-8')
  assert.notEqual(a.emblemKey, b.emblemKey)
  assert.notEqual(a.tier.c1, b.tier.c1)
  // Idempotente:
  assert.deepEqual(resolvePrime(3), resolvePrime(3))
})

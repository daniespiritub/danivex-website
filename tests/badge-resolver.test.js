import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveBadge } from '../api/_lib/badge-resolver.js'

test('badge-resolver: Elite Pass badge 1001000100 => Mystery Badge + imagen', () => {
  const b = resolveBadge('1001000100')
  assert.ok(b)
  assert.equal(b.id, '1001000100')
  assert.equal(b.name, 'Mystery Badge')
  assert.equal(b.type, 'elite-pass')
  assert.match(b.image, /1001000100\.png$/)
  assert.equal(b.confidence, 'verified')
})

test('badge-resolver: titulo 904090001 => Warrior (type title)', () => {
  const b = resolveBadge('904090001')
  assert.ok(b)
  assert.equal(b.name, 'Warrior')
  assert.equal(b.type, 'title')
})

test('badge-resolver: sin badgeId o 0 => null (no se muestra)', () => {
  assert.equal(resolveBadge(''), null)
  assert.equal(resolveBadge('0'), null)
  assert.equal(resolveBadge(undefined), null)
  assert.equal(resolveBadge(null), null)
})

test('badge-resolver: id desconocido => imagen por id, nombre vacio, confidence derived (no inventa)', () => {
  const b = resolveBadge('1001999999')
  assert.ok(b)
  assert.equal(b.name, '')
  assert.equal(b.confidence, 'derived')
  assert.match(b.image, /1001999999\.png$/)
})

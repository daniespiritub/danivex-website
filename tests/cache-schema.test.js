import test from 'node:test'
import assert from 'node:assert/strict'
import { isCurrentSchema, CACHE_SCHEMA_VERSION } from '../api/_lib/player-model.js'

test('cache-schema: registro con la version actual => vigente', () => {
  assert.equal(isCurrentSchema({ schemaVersion: CACHE_SCHEMA_VERSION, nickname: 'X' }), true)
})

test('cache-schema: registro VIEJO (sin sello o version distinta) => NO vigente (se re-consulta)', () => {
  assert.equal(isCurrentSchema({ nickname: 'X' }), false) // sin schemaVersion (registro pre-versionado)
  assert.equal(isCurrentSchema({ schemaVersion: 1, nickname: 'X' }), false)
  assert.equal(isCurrentSchema({ schemaVersion: 999, nickname: 'X' }), false)
})

test('cache-schema: null/undefined => NO vigente', () => {
  assert.equal(isCurrentSchema(null), false)
  assert.equal(isCurrentSchema(undefined), false)
})

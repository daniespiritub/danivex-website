// El namespace por entorno es lo que impide que preview/dev contaminen el
// datastore de produccion. Se verifica el mapeo de VERCEL_ENV y que el default
// sea SIEMPRE 'dev' (nunca 'prod') cuando no esta definido.
import test from 'node:test'
import assert from 'node:assert/strict'
import { envNamespace, nsKey } from '../api/_lib/env-namespace.js'

test('envNamespace: mapea VERCEL_ENV a prod/preview/dev', () => {
  process.env.VERCEL_ENV = 'production'
  assert.equal(envNamespace(), 'prod')
  process.env.VERCEL_ENV = 'preview'
  assert.equal(envNamespace(), 'preview')
  process.env.VERCEL_ENV = 'development'
  assert.equal(envNamespace(), 'dev')
})

test('envNamespace: default seguro = dev cuando VERCEL_ENV no esta definido', () => {
  delete process.env.VERCEL_ENV
  assert.equal(envNamespace(), 'dev')
})

test('nsKey: prefija con el namespace del entorno', () => {
  process.env.VERCEL_ENV = 'production'
  assert.equal(nsKey('danivex:visits'), 'prod:danivex:visits')
  process.env.VERCEL_ENV = 'preview'
  assert.equal(nsKey('rl:uid:2196518104'), 'preview:rl:uid:2196518104')
  delete process.env.VERCEL_ENV
})

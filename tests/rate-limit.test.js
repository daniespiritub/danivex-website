// El comportamiento de seguridad critico del rate limiter es FAIL-OPEN:
// si Redis no esta disponible, jamas debe bloquear una request. Forzamos
// ausencia de env ANTES de importar para que el test sea determinista sin
// importar el entorno del shell.
process.env.KV_REST_API_URL = ''
process.env.KV_REST_API_TOKEN = ''

import test from 'node:test'
import assert from 'node:assert/strict'
import { enforceRateLimit, getClientIp } from '../api/_lib/rate-limit.js'

test('fail-open: sin Redis nunca bloquea, ni tras muchas requests', async () => {
  for (let i = 0; i < 50; i += 1) {
    const r = await enforceRateLimit({ ip: '1.2.3.4', endpoint: 'free-fire-uid', uid: '773872320' })
    assert.equal(r.blocked, false)
  }
})

test('getClientIp: primera IP de x-forwarded-for, luego x-real-ip, luego unknown', () => {
  assert.equal(getClientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } }), '9.9.9.9')
  assert.equal(getClientIp({ headers: { 'x-real-ip': '8.8.8.8' } }), '8.8.8.8')
  assert.equal(getClientIp({ headers: {} }), 'unknown')
})

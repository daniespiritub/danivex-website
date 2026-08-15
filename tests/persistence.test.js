// La persistencia debe ser FAIL-SAFE: sin KV configurado (o ante error)
// devuelve un resultado estructurado y NUNCA lanza, para que un fallo de DB
// no rompa una busqueda que ya funciono. Forzamos ausencia de KV antes de
// importar para que el test sea determinista.
process.env.KV_REST_API_URL = ''
process.env.KV_REST_API_TOKEN = ''
process.env.UPSTASH_REDIS_REST_URL = ''
process.env.UPSTASH_REDIS_REST_TOKEN = ''

import test from 'node:test'
import assert from 'node:assert/strict'
import { saveCachedProfile } from '../api/_lib/private-db.js'

test('saveCachedProfile: sin KV devuelve {saved:false} y no lanza', async () => {
  const result = await saveCachedProfile('773872320', { nickname: 'SRTㅤᴅʀᴀᴋᴇɴ爱', region: 'US', level: '78' })
  assert.equal(result.saved, false)
  assert.equal(result.reason, 'kv_not_configured')
})

test('saveCachedProfile: perfil invalido (sin nickname) no persiste ni lanza', async () => {
  const result = await saveCachedProfile('773872320', {})
  assert.equal(result.saved, false)
  assert.equal(result.reason, 'missing_uid_or_nickname')
})

test('saveCachedProfile: uid vacio no persiste ni lanza', async () => {
  const result = await saveCachedProfile('', { nickname: 'x' })
  assert.equal(result.saved, false)
})

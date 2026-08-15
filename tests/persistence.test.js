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
import { saveCachedProfile, stableProfileHash } from '../api/_lib/private-db.js'

const baseProfile = {
  nickname: 'SRTㅤᴅʀᴀᴋᴇɴ爱', region: 'US', level: '78', likes: 14877,
  clan: 'THE_MOB_QV', clanId: '2037254820', avatar: 'a', banner: 'b',
  lastLogin: '14 ago 2026', accountAge: '7 años', updatedAt: 't1', provider: 'FreeFireMania',
}

test('stableProfileHash: mismo contenido significativo => mismo hash', () => {
  assert.equal(stableProfileHash(baseProfile), stableProfileHash({ ...baseProfile }))
})

test('stableProfileHash: cambio significativo (level) => hash distinto', () => {
  assert.notEqual(stableProfileHash(baseProfile), stableProfileHash({ ...baseProfile, level: '79' }))
})

test('stableProfileHash: solo cambian campos volatiles => MISMO hash (no genera snapshot)', () => {
  const volatileOnly = { ...baseProfile, lastLogin: '15 ago 2026', accountAge: '7 años 1 dia', updatedAt: 't2', provider: 'FreeFireJornal' }
  assert.equal(stableProfileHash(baseProfile), stableProfileHash(volatileOnly))
})

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

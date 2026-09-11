import test from 'node:test'
import assert from 'node:assert/strict'
import { buildResponse } from '../api/_lib/normalize.js'

test('buildResponse: vacia el placeholder de clan de FreeFireMania', () => {
  const r = buildResponse('123456', { nickname: 'X', clan: 'Registrar Clan', clanId: '999', clanLevel: '3', clanMembers: '31' }, false)
  assert.equal(r.clan, '', 'clan placeholder debe quedar vacio')
  assert.equal(r.clanId, '999', 'clanId real se conserva')
  assert.equal(r.clanMembers, '31')
})

test('buildResponse: conserva un nombre de clan real', () => {
  const r = buildResponse('123456', { nickname: 'X', clan: 'PorN' }, false)
  assert.equal(r.clan, 'PorN')
})

test('buildResponse: pasa los campos ricos del proveedor', () => {
  const r = buildResponse('123456', {
    nickname: 'X', rankBR: 'Heroico', rankBRPoints: '4210', rankCS: 'Gran Maestro', rankCSPoints: '5120',
    primeLevel: '4', title: '900', badgeCount: '12', pet: '13', petLevel: '7',
    outfit: [{ id: '205000051' }],
  }, false)
  assert.equal(r.rankBR, 'Heroico')
  assert.equal(r.rankBRPoints, '4210')
  assert.equal(r.rankCS, 'Gran Maestro')
  assert.equal(r.primeLevel, '4')
  assert.equal(r.primeConfirmed, true)
  assert.equal(r.outfit.length, 1)
  assert.equal(r.pet, '13')
})

test('buildResponse: fuente keyless (sin ricos) => campos ricos vacios, no fabricados', () => {
  const r = buildResponse('123456', { nickname: 'X', level: '85' }, false)
  assert.equal(r.rankBR, '')
  assert.equal(r.primeLevel, '')
  assert.equal(r.primeConfirmed, false)
  assert.deepEqual(r.outfit, [])
})

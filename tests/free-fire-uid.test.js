// Regresion del scraping de perfiles. Runner nativo de Node (node:test),
// sin dependencias. Corre con `npm test`. Protege los parsers de
// FreeFireMania y FreeFireJornal y el contrato de buildResponse.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  buildResponse,
  htmlToText,
  parseFreeFireManiaProfile,
  parseFreeFireJornalProfile,
} from '../api/free-fire-uid.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, 'fixtures', name), 'utf8')

test('FreeFireMania: extrae los campos clave del perfil real', () => {
  const html = fixture('freefiremania-773872320.html')
  const p = parseFreeFireManiaProfile(htmlToText(html), html)

  assert.equal(p.nickname, 'SRTㅤᴅʀᴀᴋᴇɴ爱')
  assert.equal(p.level, '78', 'nivel de cuenta, no del clan')
  assert.equal(p.region, 'US')
  assert.equal(p.clan, 'THE_MOB_QV')
  assert.equal(p.clanId, '2037254820')
  assert.equal(p.clanLevel, '5')
  assert.equal(p.clanMembers, '47')
  assert.equal(p.verified, false)
  assert.ok(p.accountAge, 'antiguedad exacta no vacia')
})

test('FreeFireMania: likes es entero, no decimal (regresion del bug de miles)', () => {
  const html = fixture('freefiremania-773872320.html')
  const p = parseFreeFireManiaProfile(htmlToText(html), html)
  assert.equal(typeof p.likes, 'number')
  assert.equal(p.likes, 14877) // "14.877" NO debe volverse 14.877
})

test('FreeFireJornal: extrae perfil + rangos del fixture real', () => {
  const html = fixture('freefirejornal-773872320.html')
  const p = parseFreeFireJornalProfile(html)

  assert.equal(p.nickname, 'SRTㅤᴅʀᴀᴋᴇɴ爱')
  assert.equal(p.level, '78')
  assert.equal(p.region, 'US')
  assert.equal(p.clan, 'THE_MOB_QV')
  assert.equal(p.clanId, '2037254820')
  assert.equal(p.rankBR, 'Rango 330')
  assert.equal(p.rankCS, 'Rango 321')
  assert.equal(p.emulator, 'No')
  assert.equal(p.season, '52')
})

test('FreeFireJornal: likes es entero (regresion)', () => {
  const html = fixture('freefirejornal-773872320.html')
  const p = parseFreeFireJornalProfile(html)
  assert.equal(typeof p.likes, 'number')
  assert.equal(p.likes, 14877)
})

test('parsers: HTML sin perfil no inventan nickname (nickname falsy => handler cae a ok:false)', () => {
  const junk = '<html><body>nada</body></html>'
  const mania = parseFreeFireManiaProfile(htmlToText(junk), junk)
  const jornal = parseFreeFireJornalProfile(junk)
  assert.ok(!mania.nickname, 'Mania no debe producir nickname con HTML basura')
  assert.ok(!jornal.nickname, 'Jornal no debe producir nickname con HTML basura')
})

test('buildResponse: mantiene el contrato de claves (ok + campos)', () => {
  const html = fixture('freefirejornal-773872320.html')
  const profile = parseFreeFireJornalProfile(html)
  const res = buildResponse('773872320', { ...profile, provider: 'FreeFireJornal Perfil', sourceUrl: 'x' }, false)

  for (const key of ['ok', 'uid', 'nickname', 'username', 'region', 'level', 'likes', 'clan', 'clanId', 'provider', 'sourceUrl', 'cacheHit', 'diamonds', 'primeConfirmed']) {
    assert.ok(key in res, `falta la clave del contrato: ${key}`)
  }
  assert.equal(res.ok, true)
  assert.equal(typeof res.likes, 'number')
  assert.equal(res.username, res.nickname)
})

test('buildResponse: perfil vacio no verificado usa fallback honesto', () => {
  const res = buildResponse('123', {}, false)
  assert.equal(res.ok, true)
  assert.equal(res.nickname, 'Cuenta no verificada')
  assert.equal(res.likes, 0)
})

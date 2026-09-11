// Provider Layer: registro ordenado + loop de fallback. Se mockea globalThis
// .fetch por URL con los fixtures reales; no depende de la red.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchProfileFromProviders } from '../api/_lib/providers/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const maniaHtml = readFileSync(join(here, 'fixtures', 'freefiremania-773872320.html'), 'utf8')
const jornalHtml = readFileSync(join(here, 'fixtures', 'freefirejornal-773872320.html'), 'utf8')
const realFetch = globalThis.fetch

function mockFetch(map) {
  globalThis.fetch = async (url) => {
    for (const [needle, resp] of map) {
      if (String(url).includes(needle)) {
        if (resp === 'throw') throw new Error('network down')
        if (typeof resp === 'number') return { ok: false, status: resp }
        return { ok: true, text: async () => resp }
      }
    }
    return { ok: false, status: 404 }
  }
}

test('Mania primary => provider freefiremania, fallback=false', async () => {
  mockFetch([['freefiremania.com.br', maniaHtml]])
  try {
    const r = await fetchProfileFromProviders('773872320')
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'freefiremania')
    assert.equal(r.fallback, false)
    assert.equal(r.response.nickname, 'SRTㅤᴅʀᴀᴋᴇɴ爱')
    assert.equal(r.response.provider, 'FreeFireMania Fast')
  } finally { globalThis.fetch = realFetch }
})

test('Mania 403 => fallback a Jornal, fallback=true', async () => {
  mockFetch([['freefiremania.com.br', 403], ['freefirejornal.com', jornalHtml]])
  try {
    const r = await fetchProfileFromProviders('773872320')
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'freefirejornal')
    assert.equal(r.fallback, true)
    assert.equal(r.response.rankBR, 'Rango 330')
  } finally { globalThis.fetch = realFetch }
})

test('recuperacion de region: sin region, SiamBhau se salta y se reintenta con la region que detecta el keyless', async () => {
  const prevKey = process.env.SIAMBHAU_API_KEY
  process.env.SIAMBHAU_API_KEY = 'test-key'
  globalThis.fetch = async (url) => {
    const u = String(url)
    if (u.includes('freefireinfo/bhau')) {
      // SiamBhau solo responde con la region correcta (US); el provider ni
      // siquiera llega aqui sin region (devuelve no_region antes de fetch).
      return { ok: true, json: async () => ({ basicInfo: { nickname: 'RichGuy', region: 'US', rankingPoints: 3539, seasonId: 53, csRank: 323, csRankingPoints: 142, showBrRank: true, showCsRank: true, primeInfo: { primeLevel: 8 } } }) }
    }
    if (u.includes('freefireinfo/stats')) {
      const gm = u.includes('gamemode=br') ? 'br' : 'cs'
      const stats = gm === 'br'
        ? { solostats: { gamesplayed: 10, wins: 2, kills: 30, detailedstats: { deaths: 8, damage: 5000, headshotkills: 10, highestkills: 6 } } }
        : { csstats: { gamesplayed: 5, wins: 3, kills: 20, detailedstats: { deaths: 4, assists: 3, damage: 4000, headshotkills: 8, mvpcount: 2, knockdowns: 10 } } }
      return { ok: true, json: async () => ({ success: true, stats }) }
    }
    if (u.includes('freefiremania.com.br')) return { ok: true, text: async () => maniaHtml }
    return { ok: false, status: 404 }
  }
  try {
    // Sin region: SiamBhau se salta (no_region), mania detecta US, se reintenta SiamBhau.
    const r = await fetchProfileFromProviders('773872320')
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'siambhau', 'debe recuperar el proveedor rico via la region detectada')
    assert.equal(r.response.rankBR, 'Heroico') // 3539 RP
    assert.equal(r.response.primeLevel, '8')
    assert.ok(r.response.stats && r.response.stats.br, 'stats ricas adjuntas tras recuperar region')
  } finally {
    globalThis.fetch = realFetch
    if (prevKey === undefined) delete process.env.SIAMBHAU_API_KEY
    else process.env.SIAMBHAU_API_KEY = prevKey
  }
})

test('ambos fallan (network) => reason provider_error', async () => {
  mockFetch([['freefiremania.com.br', 'throw'], ['freefirejornal.com', 'throw']])
  try {
    const r = await fetchProfileFromProviders('773872320')
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'provider_error')
  } finally { globalThis.fetch = realFetch }
})

test('ambos sin perfil (html basura) => reason not_found', async () => {
  mockFetch([['freefiremania.com.br', '<html></html>'], ['freefirejornal.com', '<html></html>']])
  try {
    const r = await fetchProfileFromProviders('773872320')
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'not_found')
  } finally { globalThis.fetch = realFetch }
})

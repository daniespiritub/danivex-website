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

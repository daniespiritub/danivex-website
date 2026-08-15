import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDaniVexAiRead } from '../src/data/aiSummary.js'

const realPlayer = {
  lookupStatus: 'real', username: 'DaniメPepito', uid: '2196518104',
  region: 'US', level: '85', likes: 24197, accountAge: '6 anios', clan: 'PorN', clanId: '2060675720',
}

test('perfil no verificado => lectura honesta sin datos', () => {
  const r = buildDaniVexAiRead({ lookupStatus: 'not_verified', username: 'Cuenta no verificada', uid: '1' })
  assert.match(r, /no encontro un perfil publico/i)
})

test('perfil real => menciona datos publicos y gremio, no inventa', () => {
  const r = buildDaniVexAiRead(realPlayer, [])
  assert.match(r, /DaniメPepito/)
  assert.match(r, /nivel 85/)
  assert.match(r, /gremio PorN/)
  assert.match(r, /no inventa informacion/i)
  assert.doesNotMatch(r, /Cambios recientes/) // sin eventos => sin seccion de cambios
})

test('perfil real con historial => resume los cambios (unicos)', () => {
  const events = [
    { type: 'LEVEL_UP' }, { type: 'GUILD_CHANGED' }, { type: 'LEVEL_UP' }, { type: 'LIKES_CHANGED' },
  ]
  const r = buildDaniVexAiRead(realPlayer, events)
  assert.match(r, /Cambios recientes observados por DaniVex/)
  assert.match(r, /subio de nivel/)
  assert.match(r, /cambio de gremio/)
  assert.match(r, /vario sus me gusta/)
  // 'subio de nivel' aparece una sola vez pese a 2 LEVEL_UP
  assert.equal((r.match(/subio de nivel/g) || []).length, 1)
})

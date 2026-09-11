import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { rankEmblemSrc } from '../src/data/rankEmblems.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

test('rankEmblemSrc: mapea tier BR/CS a la ruta correcta', () => {
  assert.equal(rankEmblemSrc('br', 'heroic'), '/ff-emblems/rank-br-heroic.png')
  assert.equal(rankEmblemSrc('cs', 'heroic'), '/ff-emblems/rank-cs-heroic.png')
  assert.equal(rankEmblemSrc('br', 'grandmaster'), '/ff-emblems/rank-br-grandmaster.png')
  assert.equal(rankEmblemSrc('br', 'bronze'), '/ff-emblems/rank-br-bronze.png')
})

test('rankEmblemSrc: tier desconocido o vacio => "" (usa badge CSS)', () => {
  assert.equal(rankEmblemSrc('br', ''), '')
  assert.equal(rankEmblemSrc('br', 'mythic'), '')
  assert.equal(rankEmblemSrc('br', undefined), '')
})

test('rankEmblemSrc: modo por defecto es BR', () => {
  assert.equal(rankEmblemSrc('x', 'gold'), '/ff-emblems/rank-br-gold.png')
})

// Regresión: los 16 PNG (BR+CS x 8 tiers) deben existir self-hosted. Si un cambio
// los borra, el resolver apuntaría a imágenes rotas => TEST FAIL.
test('assets: existen los 16 emblemas oficiales en public/ff-emblems', () => {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'heroic', 'master', 'grandmaster']
  for (const mode of ['br', 'cs']) {
    for (const tier of tiers) {
      const p = join(ROOT, 'public', 'ff-emblems', `rank-${mode}-${tier}.png`)
      assert.ok(existsSync(p), `falta el emblema ${mode} ${tier}: ${p}`)
    }
  }
})

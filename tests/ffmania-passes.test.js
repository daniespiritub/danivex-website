import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePassAlbum } from '../api/_lib/providers/ffmania-passes.js'

// Fragmento con la forma REAL del album de FreeFireMania (server-rendered).
const ALBUM_HTML = `
<div class="perfil-pass-panel">
  <div class="perfil-pass-badge is-pass" title="Temporada 52"><img alt="T52"><span>1</span></div>
  <p class="perfil-pass-sub">Pase Booyah (43)</p>
  <div class="perfil-pass-grid perfil-pass-album">
    <div class="perfil-pass-badge not-owned" title="#98"><img alt="P98"><span>44</span></div>
    <div class="perfil-pass-badge" title="#97"><img alt="P97"><span>110</span></div>
    <div class="perfil-pass-badge" title="#96"><img alt="P96"><span>140</span></div>
    <p class="perfil-pass-sub">Pase de Élite (27)</p>
    <div class="perfil-pass-badge" title="#55"><img alt="P55"><span>334</span></div>
    <div class="perfil-pass-badge not-owned" title="#29"><img alt="P29"><span>128</span></div>
  </div>
</div>`

test('parsePassAlbum: separa owned/not-owned e ignora el pase actual (is-pass)', () => {
  const a = parsePassAlbum(ALBUM_HTML)
  assert.ok(a)
  assert.deepEqual(a.owned.sort((x, y) => x - y), [55, 96, 97])
  assert.deepEqual(a.notOwned.sort((x, y) => x - y), [29, 98])
  assert.equal(a.values[98], 44)
  assert.equal(a.values[55], 334)
})

test('parsePassAlbum: sin album publicado => null (no se inventa)', () => {
  assert.equal(parsePassAlbum('<div class="perfil-pass-panel"><button>Ver pases</button></div>'), null)
  assert.equal(parsePassAlbum(''), null)
  assert.equal(parsePassAlbum(null), null)
})

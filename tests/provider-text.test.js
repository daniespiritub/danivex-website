import test from 'node:test'
import assert from 'node:assert/strict'
import { htmlToText } from '../api/_lib/providers/text-utils.js'

test('provider text parser omits script/style bodies with HTML-valid closing variations', () => {
  for (const closing of ['</script>', '</script >', '</ScRiPt\n>', '</script ignored>']) {
    const text = htmlToText(`<p>Jugador</p><script>UID 999 Prime 8 ${closing}<p>Final</p>`)
    assert.doesNotMatch(text, /999|Prime/)
    assert.match(text, /Jugador\s+Final/)
  }
  assert.equal(htmlToText('<style>.private { color: red }</style ><p>Visible</p>'), 'Visible')
  assert.equal(htmlToText('<p>Visible</p><script>not closed'), 'Visible')
  assert.equal(htmlToText('<template><p>hidden</p></template><p>Visible</p>'), 'Visible')
})

test('provider text keeps Unicode and readable table/block boundaries', () => {
  assert.equal(htmlToText('<p>&Ntilde; &Aacute; SRTㅤᴅʀᴀᴋᴇɴ爱 &amp; ★</p>'), 'Ñ Á SRTㅤᴅʀᴀᴋᴇɴ爱 & ★')
  assert.match(htmlToText('<table><tr><th>UID</th><td>12345</td></tr></table>'), /UID: 12345:/)
  assert.equal(htmlToText('<p>One</p><p>Two<br>Three</p>'), 'One\nTwo\nThree')
})

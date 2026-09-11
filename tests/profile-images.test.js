import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveAvatar, resolveBanner, itemIconUrl, isCatalogUrl } from '../api/_lib/profile-images.js'
import { buildResponse } from '../api/_lib/normalize.js'

test('resolveAvatar: usa headPic (avatar equipado), NO avatarId (personaje base)', () => {
  const r = resolveAvatar({ avatarId: '102000004', headPic: '902033014' })
  assert.match(r.url, /902033014/)
  assert.ok(!r.url.includes('102000004'), 'nunca debe resolver el avatar desde avatarId cuando hay headPic')
  assert.equal(r.source, 'catalog:headPic')
})

test('resolveAvatar: prioriza la URL real de proveedor de perfil sobre el catalogo', () => {
  const real = 'https://www.freefiremania.com.br/images/itens/Icon_face_RUactivity.png'
  const r = resolveAvatar({ avatar: real, headPic: '902033014', avatarSource: 'freefiremania' })
  assert.equal(r.url, real)
  assert.equal(r.source, 'freefiremania')
})

test('resolveAvatar: ignora una URL de catalogo cacheada y re-deriva del headPic', () => {
  // snapshot viejo con avatar catalogo derivado del ID equivocado
  const stale = { avatar: 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/102000004.png', headPic: '902033014' }
  const r = resolveAvatar(stale)
  assert.match(r.url, /902033014/, 're-deriva del headPic, no reutiliza la URL de catalogo equivocada')
})

test('resolveAvatar: sin headPic ni URL real, ultimo recurso avatarId; sin nada, vacio', () => {
  assert.match(resolveAvatar({ avatarId: '102000004' }).url, /102000004/)
  assert.equal(resolveAvatar({}).url, '')
})

test('resolveBanner: usa bannerId; prioriza URL real de proveedor', () => {
  assert.match(resolveBanner({ bannerId: '901000008' }).url, /901000008/)
  const real = 'https://www.freefiremania.com.br/images/itens/Icon_callsign_storebg_Valentine2020.png'
  assert.equal(resolveBanner({ banner: real, bannerId: '901000008' }).url, real)
})

test('avatar/banner NO pasan por el mismo resolver que las prendas del outfit', () => {
  // El resolver de items del outfit es itemIconUrl(id). El de avatar NO usa
  // avatarId indiscriminadamente: son rutas de decision distintas.
  const clothesUrl = itemIconUrl('211000253')
  assert.match(clothesUrl, /211000253/)
  const avatar = resolveAvatar({ avatarId: '102000004', headPic: '902033014' })
  assert.ok(!avatar.url.includes('102000004'))
})

test('isCatalogUrl distingue catalogo (jsdelivr) de URL real de proveedor', () => {
  assert.equal(isCatalogUrl('https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/1.png'), true)
  assert.equal(isCatalogUrl('https://www.freefiremania.com.br/images/itens/x.png'), false)
})

test('buildResponse: resuelve avatar por headPic y conserva outfit intacto', () => {
  const r = buildResponse('123456', {
    nickname: 'X', avatarId: '102000004', headPic: '902033014', bannerId: '901000008',
    outfit: [{ id: '211000253', image: 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/211000253.png' }],
  }, false)
  assert.match(r.avatar, /902033014/)
  assert.match(r.banner, /901000008/)
  assert.equal(r.outfit.length, 1)
  assert.match(r.outfit[0].image, /211000253/, 'el outfit conserva su resolver de items')
  assert.equal(r.avatarSource, 'catalog:headPic')
})

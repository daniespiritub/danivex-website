import test from 'node:test'
import assert from 'node:assert/strict'
import { companionReducer, initialCompanionState } from '../src/companion/machine.js'
import { chooseCompanionPlacement, intersects } from '../src/companion/placement.js'
import { createCharacter } from '../src/companion/createCharacter.js'
import { devices, createManualDevice, filterDevicesByPlatform, loadMassiveDeviceCatalog } from '../src/data/devices.js'
import { calculateSensitivity } from '../src/utils/sensitivity.js'

const ready = () => companionReducer(initialCompanionState, { type: 'READY' })
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height })

test('Companion: greeting waits for the actual renderer and finishes once', () => {
  let state = companionReducer(initialCompanionState, { type: 'SECTION', section: 'comunidad' })
  assert.equal(state.action, 'WAITING')
  state = companionReducer(state, { type: 'READY' })
  assert.equal(state.action, 'INTRO')
  state = companionReducer(state, { type: 'FINISH', revision: state.revision })
  assert.equal(state.action, 'WAVE')
  assert.equal(companionReducer(state, { type: 'FINISH', revision: 0 }), state)
  state = companionReducer(state, { type: 'FINISH', revision: state.revision })
  assert.equal(state.action, 'IDLE')
  assert.equal(companionReducer(state, { type: 'READY' }), state)
})

test('Companion: scanner loading cannot be interrupted by taps or sections', () => {
  let state = companionReducer(ready(), { type: 'LOADING' })
  state = companionReducer(state, { type: 'SECTION', section: 'comunidad' })
  assert.equal(state.action, 'THINKING')
  assert.equal(companionReducer(state, { type: 'TAP', index: 1 }), state)
  assert.equal(companionReducer(state, { type: 'CHANGE' }), state)
  state = companionReducer(state, { type: 'ERROR' })
  assert.equal(state.action, 'CURIOUS')
  assert.equal(state.busy, false)
})

test('Companion: success, inactivity and return remain mutually exclusive', () => {
  let state = companionReducer(ready(), { type: 'SUCCESS' })
  assert.equal(state.action, 'CELEBRATE')
  state = companionReducer(state, { type: 'INACTIVE', sleepy: true })
  assert.equal(state.action, 'SLEEPY')
  state = companionReducer(state, { type: 'ACTIVITY' })
  assert.equal(state.action, 'RETURN')
})

test('Placement: visible reserved hero anchor wins', () => {
  const anchor = rect(1100, 140, 200, 260)
  assert.deepEqual(chooseCompanionPlacement({ width: 1440, height: 900, anchor }), { ...anchor, mode: 'hero', side: 'right' })
})

test('Placement: right content forces a collision-free left position', () => {
  const obstacle = rect(160, 80, 1280, 820)
  const result = chooseCompanionPlacement({ width: 1440, height: 900, obstacles: [obstacle] })
  assert.equal(result.side, 'left')
  assert.equal(intersects(result, obstacle), false)
})

test('Placement: dense mobile layout docks; mobile keyboard/dialog hides', () => {
  const args = { width: 390, height: 844, obstacles: [rect(0, 72, 390, 772)], dock: rect(280, 12, 40, 40) }
  assert.equal(chooseCompanionPlacement(args).mode, 'dock')
  assert.equal(chooseCompanionPlacement({ ...args, hidden: true }).mode, 'hidden')
  assert.equal(chooseCompanionPlacement({ ...args, height: 240 }).mode, 'hidden')
})

test('Placement: minimized overrides hero, and a safe existing position does not jitter', () => {
  const args = { width: 1440, height: 900, anchor: rect(1100, 140, 200, 260) }
  assert.equal(chooseCompanionPlacement({ ...args, minimized: true }).mode, 'dock')
  const previous = chooseCompanionPlacement({ width: 1440, height: 900 })
  assert.deepEqual(chooseCompanionPlacement({ width: 1440, height: 900, preferredSide: 'left', previous }), previous)
})

test('Character: actual geometry, finite animation, bounded cursor and disposal', () => {
  const character = createCharacter()
  let meshCount = 0
  let disposed = 0
  character.root.traverse((object) => {
    if (object.isMesh) { meshCount++; object.geometry.addEventListener('dispose', () => disposed++) }
  })
  assert.ok(meshCount > 50)
  for (const action of ['WAVE', 'CURIOUS', 'THINKING', 'CELEBRATE', 'SLEEPY', 'MOVE_SIDE', 'IDLE']) {
    character.update({ time: 3, delta: 0.033, action, pointer: { x: 1, y: -1 }, motion: true })
    character.root.updateMatrixWorld()
    character.root.traverse((object) => assert.ok(object.matrixWorld.elements.every(Number.isFinite)))
  }
  character.dispose()
  assert.ok(disposed >= meshCount)
})

const profile = { years: 2, rootState: 'no-root', dpi: 480, fireButton: 52, fpsTarget: 'auto', gameVersion: 'ff', rankMode: 'de-ranked' }

test('Sensitivity regression: original RedMagic result and BR mode preserved', () => {
  const device = devices.find((d) => d.name === 'RedMagic 11 Pro')
  assert.deepEqual(calculateSensitivity(device, profile, {}).values,
    { general: 200, redDot: 195, scope2x: 186, scope4x: 173, sniper: 157, camera360: 196 })
  const manual = createManualDevice('entry', 'android')
  assert.ok(calculateSensitivity(manual, { ...profile, rankMode: 'br-ranked' }, {}).values.general
    < calculateSensitivity(manual, profile, {}).values.general)
})

test('Sensitivity regression: curated, massive and manual devices keep bounded results', async () => {
  const catalog = await loadMassiveDeviceCatalog()
  assert.ok(catalog.length > 38000)
  const selections = [...devices, catalog.find((d) => d.name === 'Galaxy S8 Active'), createManualDevice('mid', 'android')]
  selections.forEach((device) => {
    assert.ok(device)
    const values = calculateSensitivity(device, profile, {}).values
    assert.equal(Object.keys(values).length, 6)
    Object.values(values).forEach((value) => assert.ok(Number.isFinite(value) && value >= 0 && value <= 200))
  })
  filterDevicesByPlatform(catalog, 'ios').forEach((d) => assert.equal(d.os, 'iOS'))
  filterDevicesByPlatform(catalog, 'tablet').forEach((d) => assert.equal(d.type, 'tablet'))
  filterDevicesByPlatform(catalog, 'android').forEach((d) => assert.ok(d.os === 'Android' && d.type !== 'tablet'))
})

test('Sensitivity regression: hidden Android controls cannot influence Apple devices', () => {
  for (const name of ['iPhone 17 Pro Max', 'iPad Pro 11 M4']) {
    const device = devices.find((d) => d.name === name)
    assert.deepEqual(calculateSensitivity(device, profile, {}).values,
      calculateSensitivity(device, { ...profile, rootState: 'root', dpi: 1200, fpsTarget: '144' }, {}).values)
  }
})

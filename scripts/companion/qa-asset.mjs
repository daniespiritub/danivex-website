import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const out = resolve('.qa/companion-source/review/final-webgl')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = [], shots = [], joints = []
const page = await browser.newPage({ viewport: { width: 600, height: 800 } })
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

async function shot(name) {
  const buffer = await page.screenshot({ path: resolve(out, `${name}.png`) })
  const png = PNG.sync.read(buffer)
  let colored = 0
  for (let i = 0; i < png.data.length; i += 4) if (png.data[i] > 70 && png.data[i] > png.data[i + 1] * 1.1) colored++
  assert.ok(colored > 50, `${name} must show the asset`)
  shots.push({ name, buffer })
  joints.push({ name, ...(await page.evaluate(() => window.assetQA.stats())).joints })
}

try {
  await page.goto('http://127.0.0.1:5173/scripts/companion/qa-viewer.html')
  await page.waitForFunction(() => window.assetQA?.ready)
  for (const view of ['front', 'three-quarter', 'side', 'back', 'face', 'shoes']) {
    await page.evaluate((view) => { window.assetQA.pose('IDLE', .5); window.assetQA.setView(view) }, view)
    await shot(`idle-${view}`)
  }
  for (const [action, view] of [['WAVE', 'front'], ['POINT_LEFT', 'front'], ['POINT_RIGHT', 'front'], ['HAPPY', 'hands'], ['THINKING', 'hands'], ['SURPRISED', 'face'], ['SLEEPY', 'face'], ['BORED', 'three-quarter'], ['CELEBRATE', 'front'], ['RETURN', 'front']]) {
    await page.evaluate(({ action, view }) => { window.assetQA.pose('IDLE', .6); window.assetQA.pose(action, .8); window.assetQA.setView(view) }, { action, view })
    await shot(action.toLowerCase())
  }
  for (const action of ['MOVE_SIDE', 'HOP']) {
    await page.evaluate(() => { window.assetQA.pose('IDLE', 1); window.assetQA.setView('side') })
    for (let i = 0; i < (action === 'HOP' ? 7 : 5); i++) {
      await page.evaluate((action) => window.assetQA.pose(action, .2), action)
      await shot(`${action.toLowerCase()}-${i}`)
    }
  }
  const walk = joints.filter((p) => p.name.startsWith('move_side'))
  assert.ok(Math.max(...walk.map((p) => p['DEF-FootL'][1])) - Math.min(...walk.map((p) => p['DEF-FootL'][1])) > .04, 'walk lifts a foot')
  const hop = joints.filter((p) => p.name.startsWith('hop'))
  assert.ok(Math.max(...hop.map((p) => p['DEF-Hips'][1])) - Math.min(...hop.map((p) => p['DEF-Hips'][1])) > .06, 'hop raises hips')
  assert.ok(Math.max(...hop.map((p) => p['DEF-WristL'][1])) - Math.min(...hop.map((p) => p['DEF-WristL'][1])) > .06, 'hop coordinates the upper body')
  await page.setViewportSize({ width: 140, height: 208 })
  await page.evaluate(() => { window.assetQA.pose('IDLE', .5); window.assetQA.setView('front') })
  // The viewer preserves its initial drawing buffer; benchmark the actual app-sized buffer.
  await page.reload()
  await page.waitForFunction(() => window.assetQA?.ready)
  const performance = await page.evaluate(() => window.assetQA.benchmark())
  const stats = await page.evaluate(() => window.assetQA.stats())
  assert.deepEqual(errors, [])
  for (let batch = 0; batch < Math.ceil(shots.length / 6); batch++) {
    const entries = shots.slice(batch * 6, batch * 6 + 6)
    const sheet = new PNG({ width: 600 * entries.length, height: 800 })
    entries.forEach(({ buffer }, i) => PNG.bitblt(PNG.sync.read(buffer), sheet, 0, 0, 600, 800, i * 600, 0))
    await writeFile(resolve(out, `sheet-${batch}.png`), PNG.sync.write(sheet))
  }
  const report = { ok: true, errors, frames: shots.map((s) => s.name), joints, stats, performance }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ok: true, errors, screenshots: shots.length, performance, triangles: stats.triangles }))
} catch (error) {
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ ok: false, error: error.message, errors, joints, frames: shots.map((s) => s.name) }, null, 2))
  throw error
} finally { await browser.close() }

import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = process.env.DANIVEX_QA_URL || 'http://127.0.0.1:5173'
const local = ['127.0.0.1', 'localhost'].includes(new URL(base).hostname)
const out = resolve('.qa/framing')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const checks = []
const errors = []

async function pixels(canvas) {
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  let skin = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = png.data.subarray(i, i + 3)
    if (r > 95 && g > 45 && r > g * 1.08 && g > b * 1.1) skin++
  }
  assert.ok(skin > 80, `Nonblank shaded character required: ${skin} skin pixels`)
  return { buffer, skin }
}

async function layout(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-companion-root]')
    const bounds = root.getBoundingClientRect()
    const stage = root.querySelector('.companion-stage').getBoundingClientRect()
    const collisions = root.dataset.mode === 'floating'
      ? [...document.querySelectorAll('[data-companion-obstacle], input, select, .visitor-counter')]
        .filter(el => {
          const r = el.getBoundingClientRect()
          return r.width && r.height && bounds.left < r.right && bounds.right > r.left && bounds.top < r.bottom && bounds.bottom > r.top
        }).map(el => el.id || el.className || el.tagName)
      : []
    return { mode: root.dataset.mode, framing: root.dataset.framing,
      bottom: bounds.bottom, height: bounds.height, viewport: innerHeight,
      stageInViewport: stage.left >= 0 && stage.right <= innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth, collisions }
  })
}

try {
  for (const [name, width, height, reduced] of [
    ['desktop', 1440, 900, false], ['laptop', 1280, 720, false],
    ['tablet', 768, 1024, false], ['breakpoint', 701, 844, false],
    ['mobile', 390, 844, false], ['small-mobile', 320, 740, false],
    ['reduced-motion', 390, 844, true],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, locale: 'es-ES',
      reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: width < 700, hasTouch: width < 700 })
    try {
      if (local) await context.route('**/api/visits', route => route.fulfill({ json: { ok: true, count: 440 } }))
      const page = await context.newPage()
      let modelRequests = 0
      page.on('request', request => { if (request.url().includes('/companion/DaniVexCharacter.glb')) modelRequests++ })
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`) })
      await page.goto(base)
      const canvas = page.locator('canvas[data-rendered="true"]')
      await canvas.waitFor({ timeout: 30000 })
      await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.state === 'IDLE')
      const originalCanvas = await canvas.elementHandle()
      const hero = await layout(page)
      assert.equal(hero.mode, 'hero')
      assert.equal(hero.framing, 'portrait')
      assert.equal(hero.overflow, false)
      assert.equal(hero.stageInViewport, true)
      const heroPixels = await pixels(canvas)
      await page.screenshot({ path: resolve(out, `${name}-hero.png`) })
      await writeFile(resolve(out, `${name}-portrait.png`), heroPixels.buffer)
      if (reduced) {
        await page.waitForTimeout(200)
        const after = PNG.sync.read((await pixels(canvas)).buffer)
        assert.deepEqual(after.data, PNG.sync.read(heroPixels.buffer).data)
      }
      const modes = []
      for (const y of [250, 600, 1200, 2100]) {
        await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y)
        await page.waitForTimeout(550)
        const state = await layout(page)
        assert.equal(state.overflow, false)
        assert.equal(state.framing, 'full')
        assert.deepEqual(state.collisions, [])
        if (width >= 1181) assert.equal(state.mode, 'floating')
        if (state.mode === 'floating') {
          assert.equal(Math.round(state.bottom), state.viewport - 60)
          assert.ok(state.height < hero.height)
          await pixels(canvas)
        }
        modes.push(state.mode)
        if (y === 600) await page.screenshot({ path: resolve(out, `${name}-scrolled.png`) })
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(600)
      assert.equal((await layout(page)).framing, 'portrait')
      assert.equal(await originalCanvas.evaluate(el => el === document.querySelector('canvas')), true)
      assert.equal(modelRequests, 1, 'Scroll must reuse the already loaded GLB')
      checks.push({ name, ok: true, heroSkinPixels: heroPixels.skin, scrollModes: modes, modelRequests })
      console.log(`PASS framing ${name}`)
    } catch (error) {
      checks.push({ name, ok: false, error: error.message })
      console.error(`FAIL framing ${name}: ${error.message}`)
    } finally { await context.close() }
  }
} finally {
  await browser.close()
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ base, date: new Date().toISOString(), checks, errors }, null, 2))
}
console.log(JSON.stringify({ passed: checks.filter(c => c.ok).length, failed: checks.filter(c => !c.ok).length, errors }, null, 2))
if (checks.some(c => !c.ok) || errors.length) process.exitCode = 1

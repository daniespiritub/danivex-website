import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = process.env.DANIVEX_QA_URL || 'http://127.0.0.1:5173'
const local = ['127.0.0.1', 'localhost'].includes(new URL(base).hostname)
const out = resolve('.qa', local ? 'local' : 'production')
await mkdir(out, { recursive: true })
const checks = []
const errors = []
const viewports = [
  ['desktop-wide', 1920, 1080], ['desktop', 1440, 900], ['laptop', 1280, 720],
  ['tablet-landscape', 1024, 768], ['tablet', 768, 1024],
  ['iphone', 390, 844], ['android', 360, 800], ['small-mobile', 320, 740],
]
const fixtureUid = '2196518104'
const fixtureResponse = await fetch(`https://danivex.com/api/player?uid=${fixtureUid}`)
assert.equal(fixtureResponse.ok, true, 'public player fixture must be reachable')
const playerFixture = await fixtureResponse.json()
assert.equal(playerFixture.ok, true)
const browser = await chromium.launch({ headless: true })

async function context(options = {}) {
  const ctx = await browser.newContext({ locale: 'es-ES', ...options })
  if (local) {
    // Fixtures are confined to the test browser. Application APIs are untouched.
    await ctx.route('**/api/visits', (route) => route.fulfill({ json: { ok: true, count: 440 } }))
    await ctx.route('**/api/player?*', (route) => route.fulfill({ json: playerFixture }))
    await ctx.route('**/api/free-fire-timeline?*', (route) => route.fulfill({ json: { ok: true, events: [] } }))
  }
  return ctx
}

async function check(name, fn) {
  try { const detail = await fn(); checks.push({ name, ok: true, ...detail }); console.log(`PASS ${name}`) }
  catch (error) { checks.push({ name, ok: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`) }
}

function captureErrors(page) {
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`)
  })
}

async function canvasCheck(page) {
  const canvas = page.locator('canvas[data-rendered="true"]')
  await canvas.waitFor({ state: 'visible', timeout: 20000 })
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  let skinPixels = 0
  const colors = new Set()
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = png.data.subarray(i, i + 3)
    if (r > 95 && g > 45 && r > g * 1.08 && g > b * 1.1) skinPixels++
    if (r + g + b > 120) colors.add(`${r >> 3},${g >> 3},${b >> 3}`)
  }
  assert.ok(skinPixels > 80, `character must have visible skin pixels: ${skinPixels}`)
  assert.ok(colors.size > 35, `character must be shaded, not blank: ${colors.size}`)
  return { canvasPixels: png.width * png.height, skinPixels, colors: colors.size, buffer }
}

async function layoutCheck(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-companion-root]')
    const bounds = root?.getBoundingClientRect()
    const collisions = root?.dataset.mode !== 'floating' ? [] : [...document.querySelectorAll('[data-companion-obstacle], input, select, .visitor-counter')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width && r.height && bounds.left < r.right && bounds.right > r.left && bounds.top < r.bottom && bounds.bottom > r.top
      }).map((el) => el.id || el.className || el.tagName)
    return { overflow: document.documentElement.scrollWidth > innerWidth, mode: root?.dataset.mode, collisions }
  })
}

try {
  for (const [name, width, height] of viewports) {
    await check(`responsive ${name}`, async () => {
      const ctx = await context({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 })
      try {
        const page = await ctx.newPage()
        captureErrors(page)
        await page.goto(base, { waitUntil: 'networkidle' })
        await page.locator('[data-companion-root][data-mode="hero"]').waitFor()
        const { buffer, ...pixels } = await canvasCheck(page)
        await writeFile(resolve(out, `${name}-character.png`), buffer)
        assert.equal(await page.locator('h1').innerText(), 'DANIVEX.')
        const heroLayout = await layoutCheck(page)
        assert.equal(heroLayout.overflow, false)
        await page.screenshot({ path: resolve(out, `${name}-home.png`) })
        const initialRequests = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name))
        assert.ok(!initialRequests.some((url) => url.includes('androidDevices.generated')), 'massive catalog must remain lazy')
        await page.locator('.hero-shortcut').first().click()
        await page.waitForTimeout(700)
        const layout = await layoutCheck(page)
        assert.equal(layout.overflow, false)
        assert.deepEqual(layout.collisions, [])
        await page.screenshot({ path: resolve(out, `${name}-sensitivity.png`) })
        if (width < 700) {
          await page.getByRole('searchbox', { name: 'Buscar modelo' }).focus()
          await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.mode === 'hidden')
          await page.getByRole('button', { name: 'iOS', exact: true }).click()
          assert.equal(await page.getByRole('spinbutton', { name: 'DPI del dispositivo' }).count(), 0)
        }
        return { width, height, ...pixels, ...layout }
      } finally { await ctx.close() }
    })
  }

  await check('sensitivity, catalog, manual fallback, languages and screenshot tabs', async () => {
    const ctx = await context({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
    try {
      const page = await ctx.newPage()
      captureErrors(page)
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.locator('.hero-shortcut').first().click()
      const values = () => page.locator('.result-card strong').evaluateAll((elements) => elements.map((el) => Number(el.firstChild.textContent)))
      assert.deepEqual(await values(), [200, 195, 186, 173, 157, 196])
      await page.getByRole('button', { name: 'iOS', exact: true }).click()
      assert.equal(await page.getByRole('combobox', { name: 'Estado Android', exact: true }).count(), 0)
      assert.equal(await page.getByRole('combobox', { name: 'FPS objetivo', exact: true }).count(), 0)
      await page.getByRole('button', { name: 'Tablet', exact: true }).click()
      assert.equal(await page.getByRole('combobox', { name: 'Estado Android', exact: true }).count(), 1)
      const search = page.getByRole('searchbox', { name: 'Buscar modelo' })
      await search.fill('iPad Pro 11 M4')
      await page.getByRole('button', { name: /^iPad Pro 11 M4 Apple/ }).click()
      assert.equal(await page.getByRole('spinbutton', { name: 'DPI del dispositivo' }).count(), 0)
      await page.getByRole('button', { name: 'Android', exact: true }).click()
      await search.fill('Galaxy S8 Active')
      await page.getByRole('button', { name: /^Galaxy S8 Active Samsung/ }).click()
      assert.equal(await page.locator('.selected-device h4').innerText(), 'Galaxy S8 Active')
      await search.fill('unknown-device-not-in-catalog')
      await page.getByRole('button', { name: /^No encuentro mi dispositivo/ }).click()
      await page.getByRole('button', { name: 'Gama baja', exact: true }).click()
      const de = await values()
      await page.getByRole('combobox', { name: 'Clasificatoria', exact: true }).selectOption('br-ranked')
      const br = await values()
      assert.ok(br[0] < de[0])
      await page.getByRole('button', { name: 'Copiar', exact: true }).click()
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /DaniVex.*Android gama baja/)
      for (const [lang, docLang] of [['pt', 'pt-BR'], ['en', 'en'], ['es', 'es']]) {
        await page.locator('.language-select').selectOption(lang)
        assert.equal(await page.locator('html').getAttribute('lang'), docLang)
        assert.deepEqual(await values(), br)
      }
      await page.locator('.menu a[href="#mobilador"]').click()
      await page.getByRole('tab', { name: 'Perfiles', exact: true }).click()
      assert.match(await page.locator('.product-screen img').getAttribute('src'), /perfiles/)
      await page.getByRole('tab', { name: 'Perfiles', exact: true }).press('ArrowRight')
      assert.equal(await page.getByRole('tab', { name: 'Acerca de', exact: true }).getAttribute('aria-selected'), 'true')
      await page.locator('.product-screen img').evaluate((img) => img.decode())
      await page.locator('#mobilador').scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await page.screenshot({ path: resolve(out, 'mobilador.png') })
      assert.match(await page.locator('.release-row .btn').getAttribute('href'), /releases\/download\/v0\.0\.0\.1\/DaniVex-Mobilador-Setup\.exe$/)
      return { de, br, catalog: 'lazy and functional', languages: ['es', 'pt', 'en'] }
    } finally { await ctx.close() }
  })

  await check('Companion greeting, motion pixels, interaction, pause and persistent minimize', async () => {
    const ctx = await context({ viewport: { width: 1440, height: 900 } })
    try {
      const page = await ctx.newPage()
      captureErrors(page)
      await page.goto(base)
      await canvasCheck(page)
      await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.state === 'WAVE')
      await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.state === 'IDLE')
      const first = PNG.sync.read(await page.locator('canvas').screenshot())
      await page.getByRole('button', { name: 'Saludar a DaniVex', exact: true }).click()
      await page.waitForTimeout(650)
      const second = PNG.sync.read(await page.locator('canvas').screenshot())
      let changed = 0
      for (let i = 0; i < first.data.length; i += 4) if (Math.abs(first.data[i] - second.data[i]) > 15) changed++
      assert.ok(changed > 100, `greeting must visibly move geometry: ${changed}`)
      await page.getByRole('button', { name: 'Pausar movimientos', exact: true }).click()
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-motion'), 'paused')
      await page.getByRole('button', { name: 'Minimizar Companion', exact: true }).click()
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-mode'), 'dock')
      assert.equal(await page.locator('canvas').count(), 0)
      await page.getByRole('button', { name: 'Mostrar Companion', exact: true }).click()
      await page.locator('canvas[data-rendered="true"]').waitFor()
      return { changedPixels: changed, preferencesPersist: true }
    } finally { await ctx.close() }
  })

  await check('Companion inactivity, return and rapid taps have distinct states', async () => {
    const ctx = await context({ viewport: { width: 1440, height: 900 } })
    try {
      const page = await ctx.newPage()
      captureErrors(page)
      await page.clock.install()
      await page.goto(base)
      await canvasCheck(page)
      await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.state === 'IDLE')
      await page.clock.fastForward(41000)
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-state'), 'BORED')
      await page.mouse.move(30, 300)
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-state'), 'RETURN')
      await page.clock.fastForward(86000)
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-state'), 'SLEEPY')
      const hit = page.getByRole('button', { name: 'Saludar a DaniVex', exact: true })
      for (let i = 0; i < 4; i++) await hit.click()
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-state'), 'SURPRISED')
      return { boredom: true, sleep: true, return: true, rapidTap: true }
    } finally { await ctx.close() }
  })

  await check('reduced motion and absent WebGL preserve the tools', async () => {
    const ctx = await context({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    try {
      const page = await ctx.newPage()
      captureErrors(page)
      await page.goto(base, { waitUntil: 'networkidle' })
      await canvasCheck(page)
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-motion'), 'paused')
      await page.reload()
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type.startsWith('webgl') ? null : original.call(this, type, ...args)
        }
      })
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1200)
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-mode'), 'dock')
      await page.getByRole('button', { name: 'iOS', exact: true }).click()
      assert.match(await page.locator('.selected-device h4').innerText(), /iPhone/)
      return { reducedMotion: true, noWebGL: true }
    } finally { await ctx.close() }
  })

  await check('Player Scanner route, exact nickname, results and mobile layout', async () => {
    const ctx = await context({ viewport: { width: 1440, height: 900 } })
    try {
      const page = await ctx.newPage()
      captureErrors(page)
      await page.goto(`${base}/player-scanner`, { waitUntil: 'networkidle' })
      await canvasCheck(page)
      await page.getByLabel('UID del jugador', { exact: true }).fill(fixtureUid)
      await page.getByRole('button', { name: 'Buscar jugador', exact: true }).click()
      await page.locator('.pc-name').waitFor({ timeout: 40000 })
      assert.equal(await page.locator('.pc-name').innerText(), playerFixture.username)
      await page.waitForTimeout(700)
      await page.locator('.pc').scrollIntoViewIfNeeded()
      await page.locator('.pc img').evaluateAll((images) => Promise.all(images.map((img) => img.decode().catch(() => null))))
      assert.equal((await layoutCheck(page)).overflow, false)
      await page.screenshot({ path: resolve(out, 'scanner-profile-desktop.png') })
      await page.screenshot({ path: resolve(out, 'scanner-desktop.png'), fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(500)
      assert.equal((await layoutCheck(page)).overflow, false)
      await page.locator('.pc').scrollIntoViewIfNeeded()
      await page.screenshot({ path: resolve(out, 'scanner-profile-mobile.png') })
      assert.equal(await page.locator('.navbar').evaluate((el) => Math.round(el.getBoundingClientRect().top)), 0)
      await page.screenshot({ path: resolve(out, 'scanner-mobile.png'), fullPage: true })
      if (await page.getByRole('button', { name: 'Ver datos adicionales', exact: true }).count()) {
        await page.getByRole('button', { name: 'Ver datos adicionales', exact: true }).click()
        await page.getByRole('dialog', { name: 'Datos complementarios' }).waitFor()
        await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.mode === 'hidden')
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
      }
      if (local) {
        await page.route('**/api/player?*', (route) => route.fulfill({ json: { ok: false, error: 'not_found', message: 'Perfil no disponible.' } }))
        await page.getByRole('button', { name: 'Buscar otro jugador', exact: true }).click()
        await page.getByLabel('UID del jugador', { exact: true }).fill('999999999999')
        await page.getByRole('button', { name: 'Buscar jugador', exact: true }).click()
        await page.locator('.ps-error').waitFor()
        assert.equal(await page.locator('.pc-name').count(), 0)
      }
      return { uid: fixtureUid, exactNickname: true, realApi: !local }
    } finally { await ctx.close() }
  })
} finally {
  await browser.close()
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ base, date: new Date().toISOString(), checks, errors: [...new Set(errors)] }, null, 2))
}
console.log(JSON.stringify({ passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, errors: [...new Set(errors)], report: resolve(out, 'report.json') }, null, 2))
if (checks.some((c) => !c.ok) || errors.length) process.exitCode = 1

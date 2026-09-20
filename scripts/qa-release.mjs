import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const base = new URL(process.env.DANIVEX_QA_URL || 'https://danivex.com').origin
const out = resolve('.qa', process.env.DANIVEX_QA_LABEL || 'release')
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const headers = bypass ? { 'x-vercel-protection-bypass': bypass } : {}
const checks = []
const errors = []
const warnings = []
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })

async function check(name, fn) {
  try { const detail = await fn(); checks.push({ name, ok: true, ...detail }); console.log(`PASS ${name}`) }
  catch (error) { checks.push({ name, ok: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`) }
}

async function request(path, options = {}) {
  return fetch(`${base}${path}`, { redirect: 'manual', ...options, headers: { ...headers, ...options.headers } })
}

async function context(width = 1440, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'es-ES', isMobile: width < 700, hasTouch: width < 700 })
  await ctx.addInitScript(() => sessionStorage.setItem('danivex-visit-session', '1'))
  if (bypass) {
    // The preview credential must never be sent to an external asset/provider.
    await ctx.route(`${base}/**`, (route) => route.continue({ headers: { ...route.request().headers(), ...headers } }))
  }
  return ctx
}

function observe(page) {
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`)
  })
}

async function layout(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow')
  const broken = await page.locator('img').evaluateAll((images) => images.filter((img) => img.complete && !img.naturalWidth).map((img) => img.src))
  assert.deepEqual(broken, [], 'broken images')
}

async function pixels(page) {
  const canvas = page.locator('canvas[data-rendered="true"]')
  await canvas.waitFor({ state: 'visible', timeout: 45000 })
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  const colors = new Set()
  let skin = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = png.data.subarray(i, i + 3)
    if (r > 95 && g > 45 && r > g * 1.08 && g > b * 1.1) skin++
    if (r + g + b > 120) colors.add(`${r >> 3},${g >> 3},${b >> 3}`)
  }
  assert.ok(skin > 80 && colors.size > 35, `blank/unshaded character: ${skin}/${colors.size}`)
  return { buffer, skin, colors: colors.size }
}

try {
  await check('headers, metadata, disabled capabilities and private endpoint gates', async () => {
    const home = await request('/')
    assert.equal(home.status, 200)
    assert.equal(home.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(home.headers.get('x-frame-options'), 'DENY')
    assert.match(home.headers.get('strict-transport-security') || '', /max-age=/)
    assert.match(home.headers.get('content-security-policy') || '', /object-src 'none'/)
    assert.match(home.headers.get('content-security-policy') || '', /connect-src 'self' blob:;/)
    const html = await home.text()
    assert.doesNotMatch(html, /monetag|tag\.min\.js|data-zone|data-cfasync|quge5\.com|nap5k\.com|5gvci\.com|3nbf4\.com/i)
    assert.match(html, /rel="canonical" href="https:\/\/danivex\.com\/"/)
    const config = await (await request('/api/auth?action=config')).json()
    assert.equal(config.account, false)
    assert.equal(config.assistant, false)
    for (const path of ['/api/account?action=overview', '/api/auth?action=session']) {
      const res = await request(path)
      assert.ok([200, 401, 503].includes(res.status), `${path} ${res.status}`)
      assert.match(res.headers.get('cache-control') || '', /no-store/)
      const body = await res.text()
      assert.doesNotMatch(body, /node_modules|stack|postgres:\/\/|service_role/i)
    }
    const csrf = await request('/api/auth?action=signin', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://foreign.invalid' }, body: '{}' })
    assert.equal(csrf.status, 403)
    const assistant = await request('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://danivex.com' }, body: '{}' })
    assert.equal(assistant.status, 503)
    return { config, csrf: csrf.status, assistant: assistant.status }
  })

  await check('public, private, sitemap, robots, worker cleanup and 404 routes', async () => {
    const paths = ['/', '/player-scanner', '/privacy', '/signin', '/register', '/reset-password', '/auth/confirm', '/account', ...['favorites', 'saved', 'downloads', 'assistant', 'support', 'settings'].map((p) => `/account/${p}`)]
    for (const path of paths) {
      const res = await request(path)
      assert.equal(res.status, 200, path)
      const html = await res.text()
      if (/^\/(account|signin|register|reset-password|auth)/.test(path)) assert.match(html, /name="robots" content="noindex/)
    }
    const missing = await request('/qa-route-does-not-exist-20260920')
    assert.equal(missing.status, 404)
    const robots = await (await request('/robots.txt')).text()
    assert.match(robots, /Sitemap: https:\/\/danivex\.com\/sitemap.xml/)
    const sitemap = await (await request('/sitemap.xml')).text()
    assert.match(sitemap, /https:\/\/danivex\.com\/privacy/)
    assert.doesNotMatch(sitemap, /\/account|\/signin|\/register/)
    for (const path of ['/sw.js', '/public/sw.js']) {
      const res = await request(path)
      assert.ok([200, 404, 410].includes(res.status))
      assert.doesNotMatch(await res.text(), /importScripts|monetag|tag\.min\.js|quge5\.com|nap5k\.com|5gvci\.com|3nbf4\.com/i)
    }
    return { routes: paths.length, missing: 404 }
  })

  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await check(`home, lazy catalog and 3D at ${width}px`, async () => {
      const ctx = await context(width)
      try {
        const page = await ctx.newPage()
        observe(page)
        await page.goto(base, { waitUntil: 'networkidle' })
        const { buffer, ...rendered } = await pixels(page)
        await writeFile(resolve(out, `character-${width}.png`), buffer)
        assert.equal(await page.locator('h1').innerText(), 'DANIVEX.')
        await layout(page)
        assert.equal(await page.locator('a[href="/signin"]').count(), 0)
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name))
        assert.ok(!resources.some((url) => url.includes('androidDevices.generated')))
        await page.screenshot({ path: resolve(out, `home-${width}.png`) })
        await page.locator('.hero-shortcut').first().click()
        await page.waitForTimeout(700)
        await layout(page)
        assert.equal(await page.locator('.visitor-counter svg').count(), 1)
        assert.match(await page.locator('.visitor-counter').innerText(), /^[\d.,\s]+$/)
        await page.screenshot({ path: resolve(out, `sensitivity-${width}.png`) })
        return { ...rendered, catalogLoadedInitially: false }
      } finally { await ctx.close() }
    })
  }

  await check('sensitivity curated/massive/manual, device fields, ranked modes and ES/PT/EN', async () => {
    const ctx = await context()
    try {
      const page = await ctx.newPage()
      observe(page)
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.locator('.hero-shortcut').first().click()
      const values = () => page.locator('.result-card strong').evaluateAll((els) => els.map((el) => Number(el.firstChild.textContent)))
      assert.deepEqual(await values(), [200, 195, 186, 173, 157, 196])
      assert.equal(await page.getByText('AÑOS JUGANDO', { exact: true }).count(), 1)
      const fieldCount = async (expected) => {
        assert.equal(await page.getByRole('combobox', { name: 'Estado Android', exact: true }).count(), expected)
        assert.equal(await page.getByRole('combobox', { name: 'FPS objetivo', exact: true }).count(), expected)
        assert.equal(await page.getByRole('spinbutton', { name: 'DPI del dispositivo', exact: true }).count(), expected)
      }
      await fieldCount(1)
      await page.getByRole('button', { name: 'iOS', exact: true }).click()
      await fieldCount(0)
      await page.getByRole('button', { name: 'Tablet', exact: true }).click()
      await fieldCount(1)
      const search = page.getByRole('searchbox', { name: 'Buscar modelo' })
      await search.fill('iPad Pro 11 M4')
      await page.getByRole('button', { name: /^iPad Pro 11 M4 Apple/ }).click()
      await fieldCount(0)
      await page.getByRole('button', { name: 'Android', exact: true }).click()
      await search.fill('Galaxy S8 Active')
      await page.getByRole('button', { name: /^Galaxy S8 Active Samsung/ }).click()
      await fieldCount(1)
      assert.equal(await page.locator('.selected-device h4').innerText(), 'Galaxy S8 Active')
      await search.fill('unknown-device-not-in-catalog')
      await page.getByRole('button', { name: /^No encuentro mi dispositivo/ }).click()
      await page.getByRole('button', { name: 'Gama baja', exact: true }).click()
      const de = await values()
      await page.getByRole('combobox', { name: 'Clasificatoria', exact: true }).selectOption('br-ranked')
      const br = await values()
      assert.ok(br[0] < de[0])
      for (const [lang, htmlLang] of [['pt', 'pt-BR'], ['en', 'en'], ['es', 'es']]) {
        await page.locator('.language-select').selectOption(lang)
        assert.equal(await page.locator('html').getAttribute('lang'), htmlLang)
        assert.deepEqual(await values(), br)
      }
      return { de, br, fields: 'Android/tablet Android visible; iOS/iPad hidden', languages: ['es', 'pt', 'en'] }
    } finally { await ctx.close() }
  })

  await check('3D motion, interaction and persistent minimize', async () => {
    const ctx = await context()
    try {
      const page = await ctx.newPage()
      observe(page)
      await page.goto(base)
      await pixels(page)
      await page.waitForFunction(() => document.querySelector('[data-companion-root]').dataset.state === 'IDLE')
      const first = PNG.sync.read(await page.locator('canvas').screenshot())
      await page.getByRole('button', { name: 'Saludar a DaniVex', exact: true }).click()
      await page.waitForTimeout(650)
      const second = PNG.sync.read(await page.locator('canvas').screenshot())
      let changed = 0
      for (let i = 0; i < first.data.length; i += 4) if (Math.abs(first.data[i] - second.data[i]) > 15) changed++
      assert.ok(changed > 100)
      await page.getByRole('button', { name: 'Minimizar Companion', exact: true }).click()
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('[data-companion-root]').getAttribute('data-mode'), 'dock')
      assert.equal(await page.locator('canvas').count(), 0)
      return { changedPixels: changed }
    } finally { await ctx.close() }
  })

  await check('privacy and unavailable account mobile/desktop', async () => {
    for (const width of [360, 1440]) {
      const ctx = await context(width)
      try {
        const page = await ctx.newPage()
        observe(page)
        for (const path of ['/privacy', '/signin', '/account', '/account/assistant']) {
          await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
          await layout(page)
          assert.ok(await page.locator('h1').innerText())
          if (path !== '/privacy') assert.equal(await page.locator('input[type="password"]').count(), 0)
          await page.screenshot({ path: resolve(out, `${path.replaceAll('/', '-')}-${width}.png`) })
        }
      } finally { await ctx.close() }
    }
  })

  await check('real public player API, exact nickname and responsive Scanner', async () => {
    const uid = '2196518104'
    const res = await request(`/api/player?uid=${uid}`)
    const data = await res.json()
    assert.ok(res.ok && data.ok, `Real public player unavailable: HTTP ${res.status}; Scanner cannot be marked verified`)
    const ctx = await context()
    try {
      const page = await ctx.newPage()
      observe(page)
      await page.goto(`${base}/player-scanner`, { waitUntil: 'networkidle' })
      await page.getByLabel('UID del jugador', { exact: true }).fill(uid)
      await page.getByRole('button', { name: 'Buscar jugador', exact: true }).click()
      await page.locator('.pc-name').waitFor({ timeout: 45000 })
      assert.equal(await page.locator('.pc-name').innerText(), data.username)
      for (const selector of ['.pc-avatar', '.pc-banner-img']) {
        const img = page.locator(selector)
        await img.waitFor({ state: 'visible' })
        await page.waitForFunction((selector) => {
          const img = document.querySelector(selector)
          return img?.complete && img.naturalWidth > 0
        }, selector)
        const imageUrl = new URL(await img.getAttribute('src'), base)
        assert.equal(imageUrl.origin, base)
        assert.equal(imageUrl.pathname, '/api/profile-image')
        const response = await request(`${imageUrl.pathname}${imageUrl.search}`)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('content-type'), 'image/png')
        assert.ok((await response.arrayBuffer()).byteLength > 0)
      }
      for (const width of [360, 390, 430, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.locator('.pc').scrollIntoViewIfNeeded()
        await page.waitForTimeout(700)
        await layout(page)
        await page.screenshot({ path: resolve(out, `scanner-${width}.png`) })
      }
      return { providerAvailable: true, uid, exactNickname: true }
    } finally { await ctx.close() }
  })
} finally {
  await browser.close()
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ base, date: new Date().toISOString(), checks, errors: [...new Set(errors)], warnings }, null, 2))
}
console.log(JSON.stringify({ passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, errors: [...new Set(errors)], warnings, report: resolve(out, 'report.json') }, null, 2))
if (checks.some((c) => !c.ok) || errors.length) process.exitCode = 1

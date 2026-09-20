import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const base = process.env.ACCOUNT_QA_URL || 'http://127.0.0.1:5174'
const output = '.qa/account-surface'
await mkdir(output, { recursive: true })
let server
if (process.argv.includes('--start')) {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { stdio: 'pipe' })
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch { /* Wait for dev server. */ }
    await new Promise((r) => setTimeout(r, 100))
  }
}
const browser = await chromium.launch()
const checks = []
const errors = []
const user = { handle: 'Player_A', email: 'qa@example.test', providers: ['email'], language: 'es', chat_history_enabled: true, created_at: '2026-09-19T12:00:00Z' }
const config = { ok: true, account: true, assistant: true, google: true, apple: true, linking: true, deletion: true }
const mutations = []
async function context(width, signedIn = true) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: 'es-ES' })
  // Browser-only UI fixtures. NOT proof of hosted auth, email, OAuth or AI.
  await ctx.route('**/api/auth?*', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action')
    if (route.request().method() === 'POST') mutations.push({ endpoint: 'auth', action, data: route.request().postDataJSON() })
    await route.fulfill({ json: action === 'session' ? { ...config, user: signedIn ? user : null } : config })
  })
  await ctx.route('**/api/account?*', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action')
    if (route.request().method() === 'POST') mutations.push({ endpoint: 'account', action, data: route.request().postDataJSON() })
    await route.fulfill({ json: { ok: true, rows: [], counts: { favorites: 0, saved: 0, downloads: 0 }, resources: [{ id: 'sensitivity', title: 'Sensibilidad FF', href: '/#sensibilidad' }] } })
  })
  await ctx.route('**/api/assistant?*', async (route) => {
    mutations.push({ endpoint: 'assistant', data: route.request().postDataJSON() })
    await route.fulfill({ json: { ok: true, answer: 'Respuesta de prueba del proveedor simulado.', sources: [{ title: 'Sensibilidad FF', url: 'https://danivex.com/#sensibilidad' }], saved: false } })
  })
  await ctx.route('**/api/visits', (route) => route.fulfill({ json: { ok: true, count: 440 } }))
  return ctx
}
try {
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    const ctx = await context(width)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (e) => { if (e.type() === 'error') errors.push(e.text()) })
    for (const path of ['/account', '/account/favorites', '/account/saved', '/account/downloads', '/account/support', '/account/settings', '/account/assistant', '/privacy']) {
      await page.goto(base + path, { waitUntil: 'networkidle' })
      await page.locator('h1').waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${path}: overflow`)
      await page.screenshot({ path: `${output}/${width}-${path.replaceAll('/', '_')}.png` })
      checks.push({ width, path, overflow: false })
    }
    await ctx.close()
  }
  const ctx = await context(390)
  const page = await ctx.newPage()
  await page.goto(base + '/account/settings')
  await page.getByRole('heading', { name: 'Ajustes', exact: true }).waitFor()
  for (const lang of ['en', 'it', 'pt', 'es']) {
    await page.locator('.account-topline select').selectOption(lang)
    assert.equal(await page.locator('html').getAttribute('lang'), lang)
    assert.ok((await page.locator('h1').innerText()).length > 0)
  }
  await page.getByRole('textbox', { name: 'Nombre de usuario', exact: true }).fill('Player_B')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Cambios guardados.' }).waitFor()
  assert.ok(mutations.some((x) => x.action === 'profile' && x.data.handle === 'Player_B'))
  await page.goto(base + '/account/assistant')
  await page.getByRole('textbox', { name: 'Mensaje', exact: true }).fill('How do I use sensitivity?')
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await page.getByText('Respuesta de prueba del proveedor simulado.').waitFor()
  const ai = mutations.find((x) => x.endpoint === 'assistant').data
  assert.equal(ai.private_context, false)
  assert.equal(ai.save, false)
  assert.equal('email' in ai, false)
  await ctx.close()
  const anon = await context(360, false)
  const login = await anon.newPage()
  for (const path of ['/signin', '/register', '/reset-password']) {
    await login.goto(base + path, { waitUntil: 'networkidle' })
    assert.equal(await login.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await login.screenshot({ path: `${output}/360-${path.slice(1)}.png` })
  }
  await anon.close()
  assert.deepEqual(errors, [])
  console.log(`PASS: ${checks.length} responsive route checks; ES/EN/IT/PT; settings and assistant consent UI; 3 anonymous forms. Browser fixtures only.`)
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify({ mode: 'browser-fixtures-only', checks, errors, mutations }, null, 2))
  await browser.close()
  server?.kill()
}

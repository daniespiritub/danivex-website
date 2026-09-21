import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
const records = []
try {
  const context = await browser.newContext()
  await context.addInitScript(() => sessionStorage.setItem('danivex-visit-session', '1'))
  const page = await context.newPage()
  const network = await context.newCDPSession(page)
  const imageRequests = new Map()
  await network.send('Network.enable')
  network.on('Network.requestWillBeSent', ({ requestId, request, type }) => {
    if (type === 'Image' && new URL(request.url).hostname === 'www.freefiremania.com.br') imageRequests.set(requestId, request.url)
  })
  network.on('Network.responseReceivedExtraInfo', ({ requestId, statusCode, headers }) => {
    const url = imageRequests.get(requestId)
    if (url) records.push({ url, rawStatus: statusCode, rawHeaders: headers })
  })
  network.on('Network.loadingFailed', ({ requestId, errorText, blockedReason }) => {
    const url = imageRequests.get(requestId)
    if (url) records.push({ url, errorText, blockedReason })
  })
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'image') records.push({ url: request.url(), failure: request.failure() })
  })
  page.on('response', async (response) => {
    if (new URL(response.url()).hostname === 'www.freefiremania.com.br' && response.request().resourceType() === 'image') {
      records.push({ url: response.url(), status: response.status(), headers: await response.allHeaders() })
    }
  })
  page.on('console', (message) => { if (message.type() === 'error') records.push({ console: message.text() }) })
  await page.goto('https://danivex.com/player-scanner', { waitUntil: 'networkidle' })
  await page.getByLabel('UID del jugador', { exact: true }).fill('2196518104')
  await page.getByRole('button', { name: 'Buscar jugador', exact: true }).click()
  await page.locator('.pc-name').waitFor({ timeout: 45000 })
  await page.waitForLoadState('networkidle')
  records.push({ images: await page.locator('.pc img').evaluateAll((images) => images.map((image) => ({ url: image.src, loaded: image.complete && image.naturalWidth > 0 }))) })
} finally {
  await browser.close()
  await mkdir('.qa/scanner-image-diagnostic', { recursive: true })
  await writeFile('.qa/scanner-image-diagnostic/network.json', JSON.stringify(records, null, 2))
  console.log(JSON.stringify(records, null, 2))
}

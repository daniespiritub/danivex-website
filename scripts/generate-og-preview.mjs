import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:5183/og-preview-source.html'
const outPath = process.argv[3] || 'public/preview.png'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.screenshot({ path: outPath })
await browser.close()
console.log(`Saved ${outPath}`)

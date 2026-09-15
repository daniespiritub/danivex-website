import { chromium } from 'playwright'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const out = resolve('.qa/companion-source/review/final-webgl')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 600, height: 800 }, recordVideo: { dir: out, size: { width: 600, height: 800 } } })
const page = await context.newPage()
const timeline = []
try {
  await page.goto('http://127.0.0.1:5173/scripts/companion/qa-viewer.html')
  await page.waitForFunction(() => window.assetQA?.ready)
  for (const [action, view, seconds] of [['WAVE', 'front', 2.6], ['POINT_LEFT', 'front', 3], ['POINT_RIGHT', 'front', 3], ['THINKING', 'hands', 3], ['HAPPY', 'hands', 2.7], ['HOP', 'side', 1.8], ['MOVE_SIDE', 'three-quarter', 2.4], ['CELEBRATE', 'front', 3], ['RETURN', 'front', 2.2]]) {
    await page.evaluate(({ action, view }) => { window.assetQA.run(false); window.assetQA.pose('IDLE', .6); window.assetQA.pose(action, .01); window.assetQA.setView(view); window.assetQA.run(true) }, { action, view })
    const start = Date.now()
    const samples = []
    while (Date.now() - start < seconds * 1000) {
      await page.waitForTimeout(100)
      samples.push({ milliseconds: Date.now() - start, ...(await page.evaluate(() => window.assetQA.stats())).joints })
    }
    timeline.push({ action, view, seconds, samples })
  }
  const video = page.video()
  await context.close()
  await copyFile(await video.path(), resolve(out, 'animation-review.webm'))
  await writeFile(resolve(out, 'motion-timeline.json'), JSON.stringify(timeline, null, 2))
  console.log(JSON.stringify({ video: resolve(out, 'animation-review.webm'), clips: timeline.length }))
} finally { await browser.close() }

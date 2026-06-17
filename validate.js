const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:8081'
const OUT = 'D:/temp/togo_screenshots'

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

const SCREENS = [
  { name: '01_home',         url: '/' },
  { name: '02_discover',     url: '/discover' },
  { name: '03_tickets',      url: '/tickets' },
  { name: '04_profile',      url: '/profile' },
  { name: '05_create_event', url: '/create-event' },
]

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/nanus/AppData/Local/ms-playwright/chromium-1223/chrome-win/chrome.exe',
  })

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },  // iPhone 14 size
    deviceScaleFactor: 2,
  })

  const errors = []
  const results = []

  for (const screen of SCREENS) {
    const page = await context.newPage()

    // Capture JS errors
    const pageErrors = []
    page.on('pageerror', e => pageErrors.push(e.message))
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(msg.text())
    })

    try {
      await page.goto(BASE + screen.url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000) // let animations settle

      const shot = path.join(OUT, screen.name + '.png')
      await page.screenshot({ path: shot, fullPage: false })

      // Check for white background (not black screen)
      const bg = await page.evaluate(() => {
        const el = document.body
        return window.getComputedStyle(el).backgroundColor
      })

      // Check if content rendered (look for text nodes)
      const textContent = await page.evaluate(() => document.body.innerText?.trim().slice(0, 200))

      results.push({
        screen: screen.name,
        url: screen.url,
        bg,
        hasContent: textContent.length > 0,
        preview: textContent.slice(0, 80).replace(/\n/g, ' '),
        jsErrors: pageErrors.length,
        screenshot: shot,
      })

      if (pageErrors.length) errors.push({ screen: screen.name, errors: pageErrors })
    } catch (e) {
      results.push({ screen: screen.name, url: screen.url, error: e.message })
      errors.push({ screen: screen.name, errors: [e.message] })
    }

    await page.close()
  }

  await browser.close()

  console.log('\n==== TOGO APP VALIDATION RESULTS ====\n')
  results.forEach(r => {
    if (r.error) {
      console.log(`❌ ${r.screen}: FAILED — ${r.error}`)
    } else {
      const ok = r.hasContent && r.jsErrors === 0
      console.log(`${ok ? '✅' : '⚠️ '} ${r.screen}`)
      console.log(`   bg: ${r.bg}`)
      console.log(`   content: "${r.preview}"`)
      console.log(`   js errors: ${r.jsErrors}`)
      console.log(`   screenshot: ${r.screenshot}`)
    }
    console.log()
  })

  if (errors.length) {
    console.log('==== JS ERRORS ====')
    errors.forEach(e => {
      console.log(`\n${e.screen}:`)
      e.errors.forEach(msg => console.log('  -', msg.slice(0, 200)))
    })
  }

  console.log(`\nScreenshots saved to: ${OUT}`)
})()

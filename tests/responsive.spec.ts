import { expect, test, type Page } from '@playwright/test'
import { FOUR, settled } from './helpers.ts'

// Layout contracts measured in the browser at the breakpoints they depend on (Phase B).
// Also runs against a deployed site via PLAYWRIGHT_BASE_URL, where host overlays (Netlify's badge) exist.

// Each test sweeps many widths (up to 48 page loads); against a deployed site that exceeds the 30s default.
test.describe.configure({ timeout: 120_000 })

const HEIGHT: Record<number, number> = {
  320: 640, 375: 812, 390: 844, 600: 960, 720: 1024, 768: 1024, 834: 1194, 900: 800,
  960: 800, 1039: 800, 1040: 800, 1100: 800, 1179: 800, 1180: 800, 1280: 800, 1440: 900,
}
const WIDTHS = Object.keys(HEIGHT).map(Number)

async function load(page: Page, width: number, query: string) {
  await page.setViewportSize({ width, height: HEIGHT[width] })
  await page.goto(query)
  await settled(page)
}

test('a focused element in the ledger is never covered by the tray, the badge or a sticky header (WCAG 2.4.11)', async ({ page }) => {
  for (const width of [375, 600, 720, 768, 834, 960, 1100, 1280]) {
    await load(page, width, FOUR)
    await page.locator('.lcard input[data-pick], .lrow input[data-pick]').locator('visible=true').first().focus()
    const covered: string[] = []
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab')
      const hit = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        const t = document.querySelector('.tray')!
        if (!el || !el.closest('.ledger') || t.contains(el)) return null
        const r = el.getBoundingClientRect()
        const covers = [t, document.getElementById('nl-badge-frame'), ...document.querySelectorAll('.ledger-table thead th')]
          .filter((o): o is Element => !!o && o.getClientRects().length > 0)
          .map((o) => o.getBoundingClientRect())
        const overlaps = covers.some((o) => r.bottom > o.top + 0.5 && r.top < o.bottom - 0.5 && r.right > o.left + 0.5 && r.left < o.right - 0.5)
        return overlaps ? (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40) : null
      })
      if (hit) covered.push(hit)
    }
    expect(covered, `${width}px`).toEqual([])
  }
})

test('the tray never renders taller than --tray-h, which sizes the focus clearance', async ({ page }) => {
  for (const width of WIDTHS) {
    for (const query of ['/?compare=northlane', '/?compare=northlane,mondray', FOUR]) {
      await load(page, width, query)
      const { h, token } = await page.evaluate(() => ({
        h: document.querySelector('.tray')!.getBoundingClientRect().height,
        token: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tray-h')),
      }))
      expect(h, `${width}px ${query}`).toBeLessThanOrEqual(token)
    }
  }
})

test('tray product names never run under their remove buttons', async ({ page }) => {
  for (const width of WIDTHS.filter((w) => w >= 600)) {
    await load(page, width, FOUR)
    const overlaps = await page.evaluate(() =>
      [...document.querySelectorAll('.tray .slot-filled')].flatMap((s) => {
        const name = s.querySelector('.slot-name')!, x = s.querySelector('.slot-x')!
        const range = document.createRange()
        range.selectNodeContents(name)
        return range.getBoundingClientRect().right > x.getBoundingClientRect().left ? [name.textContent] : []
      }),
    )
    expect(overlaps, `${width}px`).toEqual([])
  }
})

test('no horizontal overflow and no clipped CTAs, with four picks and with none', async ({ page }) => {
  for (const width of WIDTHS) {
    for (const query of [FOUR, '/']) {
      await load(page, width, query)
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        clipped: [...document.querySelectorAll<HTMLElement>('.visit, .pick-list, .tray .btn')]
          .filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1)
          .map((e) => e.textContent!.trim()),
      }))
      expect(r, `${width}px ${query}`).toEqual({ overflow: 0, clipped: [] })
    }
  }
})

test('tablet cards: identity beside the facts, one column, unbroken prices, usable details', async ({ page }) => {
  for (const width of [768, 1039]) {
    await load(page, width, '/?team=500&compare=northlane,mondray')
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('.lcard')].filter((c) => c.getClientRects().length)
      return {
        listH: document.querySelector('.ledger-list')!.getBoundingClientRect().height,
        columns: new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left))).size,
        layout: cards.every((c) => {
          const top = c.querySelector('.lcard-top')!.getBoundingClientRect()
          const facts = c.querySelector('.facts')!.getBoundingClientRect()
          const actions = c.querySelector('.lcard-actions')!.getBoundingClientRect()
          return facts.left >= top.right && actions.top >= Math.max(top.bottom, facts.bottom)
        }),
        // products that cannot serve 500 seats show a notice instead of a price
        brokenPrices: cards.filter((c) => (c.querySelector('.price-total')?.getClientRects().length ?? 1) !== 1).length,
        prices: cards.filter((c) => c.querySelector('.price-total')).length,
        overflowingFacts: cards.flatMap((c) => [...c.querySelectorAll('.facts dd')]).filter((d) => d.scrollWidth > d.clientWidth + 1).length,
        actionsVisible: cards.every((c) => c.querySelector('.visit')!.getClientRects().length && c.querySelector('.pick-list')!.getClientRects().length),
      }
    })
    expect(r, `${width}px`).toMatchObject({ columns: 1, layout: true, brokenPrices: 0, overflowingFacts: 0, actionsVisible: true })
    expect(r.prices, `${width}px priced cards`).toBeGreaterThan(0)
    expect(r.listH, `${width}px list height`).toBeLessThan(2500)
    const first = page.locator('.lcard').first()
    await first.locator('summary').click()
    const details = await first.locator('.details').boundingBox()
    expect(details!.width, `${width}px details width`).toBeGreaterThan(600)
  }
})

test('phone tray: compact, with four identifiable slots', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await load(page, width, FOUR)
    await page.locator('.lcard').nth(4).scrollIntoViewIfNeeded()
    const r = await page.evaluate(() => {
      const marks = [...document.querySelectorAll('.tray .slot-filled .mark')]
      return {
        trayH: document.querySelector('.tray')!.getBoundingClientRect().height,
        visibleMarks: marks.filter((m) => {
          const b = m.getBoundingClientRect()
          return b.width >= 12 && m.closest('.slot')!.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2))
        }).length,
      }
    })
    expect(r.visibleMarks, `${width}px`).toBe(4)
    expect(r.trayH, `${width}px`).toBeLessThanOrEqual(100)
  }
})

test('phone masthead keeps all its content and the first product sits higher', async ({ page }) => {
  await load(page, 375, '/')
  await expect(page.locator('.demo-flag')).toBeVisible()
  await expect(page.locator('.lede')).toBeVisible()
  await expect(page.locator('.steps li')).toHaveCount(3)
  for (const step of await page.locator('.steps li').all()) await expect(step).toBeVisible()
  const firstTop = await page.locator('.lcard').first().evaluate((e) => e.getBoundingClientRect().top + scrollY)
  expect(firstTop).toBeLessThanOrEqual(860) // 908 before Phase B
})

test('table scores stay on one line, unclipped and aligned with their header', async ({ page }) => {
  for (const width of [1040, 1050, 1080, 1100, 1120, 1150, 1179, 1180, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(FOUR)
    const r = await page.evaluate(() => {
      const cells = [...document.querySelectorAll<HTMLElement>('.ledger-table tbody td.col-num')]
      const scored = cells.filter((td) => td.querySelector('.score'))
      const header = document.querySelector('.ledger-table thead th.col-num .sort')!.getBoundingClientRect()
      // a product that cannot serve the team shows "Not scored" instead (it may wrap, but must fit and align)
      const lead = (td: HTMLElement) => td.querySelector('.score, .not-scored')!.getBoundingClientRect()
      return {
        notScored: cells.length - scored.length,
        // wrapped: the " / 100" scale breaks into fragments or starts below the number
        wrapped: scored.filter((td) => {
          const scale = td.querySelector('.muted')!, rects = scale.getClientRects()
          return rects.length > 1 || rects[0].top >= td.querySelector('.score')!.getBoundingClientRect().bottom - 1
        }).length,
        clipped: cells.filter((td) => td.scrollWidth > td.clientWidth + 1).length,
        misaligned: cells.filter((td) => Math.abs(lead(td).left - header.left) > 1).length,
      }
    })
    expect(r, `${width}px`).toEqual({ notScored: 1, wrapped: 0, clipped: 0, misaligned: 0 })
  }
})

test('table feature bars fit their cell and leave the next column clear', async ({ page }) => {
  for (const width of [1040, 1050, 1080, 1100, 1150, 1179, 1180, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(FOUR)
    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll<HTMLElement>('.ledger-table tbody tr.lrow')]
      const problems: string[] = []
      for (const row of rows) {
        const td = row.querySelector<HTMLElement>('td.col-features')!, cs = getComputedStyle(td), tr = td.getBoundingClientRect()
        const left = tr.left + parseFloat(cs.paddingLeft), right = tr.right - parseFloat(cs.paddingRight)
        const bar = td.querySelector<HTMLElement>('.coverage-bar')!, br = bar.getBoundingClientRect()
        const cells = [...bar.children].map((c) => c.getBoundingClientRect())
        const total = Number(td.querySelector('.coverage .line')!.textContent!.match(/of (\d+)/)![1])
        const next = row.querySelector('td.col-sw li')!.getBoundingClientRect() // its "+" glyph sits at the li's left edge
        const name = row.querySelector('.pname-name')!.textContent
        // 0.5px: subpixel rounding of percentage column widths
        if (br.left < left - 0.5 || br.right > right + 0.5) problems.push(`${name}: bar ${br.left.toFixed(1)}-${br.right.toFixed(1)} outside ${left.toFixed(1)}-${right.toFixed(1)}`)
        if (cells.some((c) => c.right > right + 0.5)) problems.push(`${name}: a cell runs past the content box`)
        if (bar.scrollWidth > bar.clientWidth + 1) problems.push(`${name}: bar content clipped`)
        if (cells.length !== total || cells.some((c) => c.width < 4 || c.height < 12)) problems.push(`${name}: ${cells.length}/${total} cells, min ${Math.min(...cells.map((c) => c.width)).toFixed(1)}px`)
        if (next.left < br.right) problems.push(`${name}: bar reaches the Stands out column`)
        const visit = row.querySelector<HTMLElement>('td.col-visit a[data-visit]')!.getBoundingClientRect()
        const price = row.querySelector('td.col-price')!.textContent!.trim()
        if (!price) problems.push(`${name}: no price`)
        if (visit.width < 24 || visit.height < 24) problems.push(`${name}: visit target ${visit.width}x${visit.height}`)
      }
      return { problems, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
    })
    expect(r, `${width}px`).toEqual({ problems: [], overflow: 0 })
  }
})

test('desktop layout is unchanged at 1280 and 1440px', async ({ page }) => {
  for (const width of [1280, 1440]) {
    await load(page, width, FOUR)
    const r = await page.evaluate(() => ({
      masthead: Math.round(document.querySelector('.masthead')!.getBoundingClientRect().height),
      firstRow: Math.round(document.querySelector('.lrow')!.getBoundingClientRect().top + scrollY),
      table: Math.round(document.querySelector('.ledger-table')!.getBoundingClientRect().height),
      tray: Math.round(document.querySelector('.tray')!.getBoundingClientRect().height),
    }))
    // Phase A baseline (a2dcb81). ±2px absorbs font rasterisation differences between machines and
    // browser builds; any real spacing change in these blocks moves them by 4px or more (smallest step used).
    const baseline = { masthead: 393, firstRow: 624, table: 1204, tray: 62 }
    for (const [key, value] of Object.entries(baseline)) {
      expect(Math.abs(r[key as keyof typeof r] - value), `${width}px ${key}: ${r[key as keyof typeof r]} vs ${value}`).toBeLessThanOrEqual(2)
    }
  }
})

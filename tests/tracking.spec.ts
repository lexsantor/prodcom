import { expect, test, type Page } from '@playwright/test'
import { pick, tray } from './helpers.ts'

// comparison_started (contract v2): the user entered the head-to-head for a set of 2+ picks; once per set,
// shared by every trigger (tray, scroll, link). v1 measured 15% of the section, which a tall phone or tablet
// comparison can never show, and counted "Compare N" twice on desktop.

type Start = { trigger: string; ids: string }
const starts = (page: Page) => page.evaluate(() =>
  ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
    .filter((e) => e.event === 'comparison_started')
    .map((e) => ({ trigger: e.trigger as string, ids: [...(e.selected_ids as string[])].sort().join(',') })))

const loaded = (page: Page) => expect.poll(() => page.evaluate(() =>
  ((window as unknown as { dataLayer?: { event: string }[] }).dataLayer ?? []).some((e) => e.event === 'comparison_page_viewed'))).toBe(true)

/** Put the head-to-head heading near the top of the viewport, as a reader scrolling down would. */
const scrollToHeading = (page: Page) => page.evaluate(() => {
  const h = document.getElementById('compare-title')!
  window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 80)
})

/** Scroll the whole comparison in steps, top to bottom, then back up past the heading and down again. */
const readThrough = (page: Page) => page.evaluate(async () => {
  const el = document.getElementById('compare')!
  const top = el.getBoundingClientRect().top + window.scrollY
  const pause = () => new Promise((r) => setTimeout(r, 30))
  for (let y = top - window.innerHeight; y < top + el.offsetHeight; y += 300) { window.scrollTo(0, y); await pause() }
  window.scrollTo(0, 0); await pause(); await pause()
  window.scrollTo(0, top - 40); await pause(); await pause()
})

const SETS = { 2: ['taskara', 'orbitask'], 4: ['northlane', 'mondray', 'taskara', 'fernwork'] } as const
const NAMES: Record<string, string> = { taskara: 'Taskara', orbitask: 'Orbitask', northlane: 'Northlane', mondray: 'Mondray', fernwork: 'Fernwork' }

for (const [width, height] of [[375, 667], [375, 812], [768, 1024], [1440, 900]] as const) {
  for (const n of [2, 4] as const) {
    const ids = SETS[n]
    const key = [...ids].sort().join(',')

    test.describe(`${width}x${height}, ${n} picks`, () => {
      test.use({ viewport: { width, height } })

      test('shared link: nothing on load, one scroll entry, never repeated', async ({ page }) => {
        await page.goto(`/?compare=${ids.join(',')}`)
        await loaded(page)
        await page.waitForTimeout(400)
        expect(await starts(page)).toEqual([])
        await readThrough(page)
        await expect.poll(() => starts(page)).toEqual<Start[]>([{ trigger: 'scroll', ids: key }])
        await scrollToHeading(page)
        await page.waitForTimeout(300)
        expect(await starts(page)).toHaveLength(1)
      })

      test('"Compare N" from the tray: one tray entry and no scroll duplicate', async ({ page }) => {
        await page.goto(`/?compare=${ids.slice(0, -1).join(',')}`)
        await loaded(page)
        await pick(page, NAMES[ids.at(-1)!]).check()
        await tray(page).getByRole('link', { name: `Compare ${n}` }).click()
        await expect.poll(() => starts(page)).toEqual<Start[]>([{ trigger: 'tray', ids: key }])
        await page.waitForTimeout(800) // the smooth scroll lands on the heading; the observer must not count it again
        await readThrough(page)
        expect(await starts(page)).toEqual<Start[]>([{ trigger: 'tray', ids: key }])
      })

      test('opened on #compare: one link entry', async ({ page }) => {
        await page.goto(`/?compare=${ids.join(',')}#compare`)
        await loaded(page)
        await expect.poll(() => starts(page)).toEqual<Start[]>([{ trigger: 'link', ids: key }])
        await readThrough(page)
        expect(await starts(page)).toHaveLength(1)
      })
    })
  }
}

test.describe('set changes and single picks', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('a changed set is a new comparison; one pick never is', async ({ page }) => {
    await page.goto('/?compare=northlane')
    await loaded(page)
    await tray(page).getByRole('link', { name: 'See alternatives' }).click()
    await page.waitForTimeout(800)
    expect(await starts(page)).toEqual([])

    await page.goto('/?compare=northlane,mondray,taskara')
    await loaded(page)
    await pick(page, 'Fernwork').check()
    await tray(page).getByRole('link', { name: 'Compare 4' }).click()
    await page.getByRole('link', { name: 'Change products' }).click()
    await pick(page, 'Fernwork').uncheck() // phone trays show slot marks only; untick in the list
    await tray(page).getByRole('link', { name: 'Compare 3' }).click()
    await expect.poll(() => starts(page)).toEqual<Start[]>([
      { trigger: 'tray', ids: 'fernwork,mondray,northlane,taskara' },
      { trigger: 'tray', ids: 'mondray,northlane,taskara' },
    ])
  })
})

import { expect, test, type Page } from '@playwright/test'

// Runs against the production build (`npm run build` first).

const tray = (page: Page) => page.getByRole('region', { name: 'Your comparison' })
const pick = (page: Page, name: string) => page.getByRole('checkbox', { name: `Compare ${name}` }).locator('visible=true')

async function noPageOverflow(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(sw).toBeLessThanOrEqual(cw + 1)
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('walks 0 → 4 selected, blocks a fifth, offers replace, and recalculates the winner', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')

    // 0 selected
    await expect(tray(page)).toContainText('0 of 4')
    await expect(page.getByRole('heading', { name: 'Nothing to compare yet' })).toBeVisible()

    // 1 selected: guidance, no fake comparison
    await pick(page, 'Mondray').check()
    await expect(tray(page)).toContainText('1 of 4')
    await expect(page.getByRole('heading', { name: /Mondray is in/ })).toBeVisible()
    await expect(page.locator('table.matrix')).toHaveCount(0)

    // 2 selected: verdict and matrix
    await pick(page, 'Plotwise').check()
    await expect(page.locator('.verdict-title')).toContainText('Mondray')
    await expect(page.locator('table.matrix thead th[data-best]')).toContainText('Best overall')

    // 3 selected: winner changes
    await pick(page, 'Northlane').check()
    await expect(page.locator('.verdict-title')).toContainText('Northlane')
    await expect(page).toHaveURL(/compare=mondray,plotwise,northlane/)

    // 4 selected: tray full
    await pick(page, 'Taskara').check()
    await expect(tray(page)).toContainText('4 of 4')
    await expect(page.locator('table.matrix thead th[scope=col]')).toHaveCount(4)

    // a fifth is refused with an explanation and a replace choice
    await pick(page, 'Veloxa').check({ trial: false }).catch(() => {})
    await expect(pick(page, 'Veloxa')).not.toBeChecked()
    const full = page.locator('#tray-full')
    await expect(full).toBeFocused()
    await expect(full).toContainText('Your comparison is full')
    await full.getByRole('button', { name: 'Replace Plotwise' }).click()
    await expect(pick(page, 'Veloxa')).toBeChecked()
    await expect(pick(page, 'Plotwise')).not.toBeChecked()
    await expect(page).toHaveURL(/compare=mondray,veloxa,northlane,taskara/)

    // deselect from 4
    await pick(page, 'Northlane').uncheck()
    await expect(tray(page)).toContainText('3 of 4')
    await expect(page.locator('.verdict-title')).not.toContainText('Northlane')

    // jump to the head-to-head moves focus to its heading
    await tray(page).getByRole('link', { name: /Compare 3/ }).click()
    await expect(page.locator('#compare-title')).toBeFocused()

    // browser Back returns to the table on the first pick instead of leaving the site
    await page.goBack()
    await expect(pick(page, 'Mondray')).toBeFocused()
    await tray(page).getByRole('link', { name: /Compare 3/ }).click()
    await expect(page.locator('#compare-title')).toBeFocused()

    // key differences is the default; the complete matrix adds the rest
    const rows = page.locator('table.matrix tbody tr:not(.m-group)')
    const key = await rows.count()
    await page.getByRole('radio', { name: /Complete matrix/ }).check()
    expect(await rows.count()).toBeGreaterThan(key)

    // "Change products" goes back to the table, on the first pick
    await page.getByRole('link', { name: 'Change products' }).click()
    await expect(pick(page, 'Mondray')).toBeFocused()

    // clear keeps focus in the tray instead of dropping it to the page
    await tray(page).getByRole('button', { name: 'Clear all' }).click()
    await expect(tray(page)).toContainText('0 of 4')
    await expect(page.locator('#tray-count')).toBeFocused()
    expect(errors).toEqual([])
  })

  test('key differences by default, verdict links to flagged rows, three levels', async ({ page }) => {
    await page.goto('/?compare=northlane,taskara')
    const views = page.getByRole('group', { name: 'Show rows' })
    const keyOpt = views.getByRole('radio', { name: /Key differences/ })
    await expect(keyOpt).toBeChecked()
    const rows = page.locator('table.matrix tbody tr:not(.m-group)')
    const key = await rows.count()
    expect(key).toBeGreaterThan(0)
    // key rows always differ between picks, and the option states its count
    await expect(page.locator('table.matrix tbody tr[data-status="same"]')).toHaveCount(0)
    await expect(keyOpt).toHaveAccessibleName(new RegExp(`${key} rows`))

    // the verdict lands on the first row where the winner is behind
    await page.getByRole('button', { name: 'See where Northlane is behind' }).click()
    await expect(page.locator('table.matrix th.m-label:focus .row-flag')).toHaveCount(1)

    // essentials and the complete matrix
    await views.getByRole('radio', { name: /Essentials/ }).check()
    const essential = await rows.count()
    await views.getByRole('radio', { name: /Complete matrix/ }).check()
    const all = await rows.count()
    expect(essential).toBeLessThan(all)
    expect(key).toBeLessThan(all)
    await expect(page.locator('table.matrix .m-group')).toHaveCount(10)

    // section index and evidence links move focus to their target
    await page.getByRole('navigation', { name: 'Comparison sections' }).getByRole('link', { name: /Admin and security/ }).click()
    await expect(page.locator('#m-admin')).toBeFocused()
    await page.getByRole('link', { name: 'See the price rows' }).click()
    await expect(page.locator('#m-price-cost')).toBeFocused()
  })

  test('behind flags name who leads; views survive a shared link; old links fall back', async ({ page }) => {
    await page.goto('/?compare=northlane,taskara&view=all')
    await expect(page.getByRole('radio', { name: /Complete matrix/ })).toBeChecked()
    // the verdict cites Taskara's quicker setup, so that row is flagged and names Taskara
    const setup = page.locator('table.matrix tbody tr', { has: page.getByRole('rowheader', { name: /Typical setup/ }) })
    await expect(setup.locator('.row-flag')).toContainText('Taskara leads')
    await expect(setup.locator('.row-flag .sr-only')).toHaveText('Northlane behind Taskara')
    await page.getByRole('radio', { name: /Key differences/ }).check()
    await expect(page).not.toHaveURL(/view=/)
    // the overall score is a key difference; score areas summarise other rows and stay out
    await expect(page.locator('#m-score-overall')).toBeVisible()
    await expect(page.locator('#m-score-area-value')).toHaveCount(0)
    await page.getByRole('radio', { name: /Essentials/ }).check()
    await expect(page).toHaveURL(/view=essential/)
    // links shared before the three-level views open on key differences
    await page.goto('/?compare=northlane,taskara&view=behind')
    await expect(page.getByRole('radio', { name: /Key differences/ })).toBeChecked()
  })

  test('winner emphasis stays on its header; row emphasis follows the row best', async ({ page }) => {
    await page.goto('/?compare=northlane,mondray,plotwise')
    await expect(page.locator('.verdict-kicker')).toContainText('highest Prodcom score of your 3')
    const fill = (sel: string) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).backgroundColor)
    // the winner's header is the badge; its body cells are framed, never filled
    expect(await fill('table.matrix thead th[data-best]')).not.toBe('rgba(0, 0, 0, 0)')
    expect(await fill('table.matrix tbody td[data-best]')).toBe('rgba(0, 0, 0, 0)')
    // a row the winner trails (Mondray has the most integrations): the leader's value is bold, the winner's is not
    const row = page.locator('tr', { has: page.locator('#m-automation-integrations') })
    const weight = (i: number) => row.locator('td .val').nth(i).evaluate((e) => getComputedStyle(e).fontWeight)
    expect(Number(await weight(0))).toBeLessThan(700)
    expect(Number(await weight(1))).toBeGreaterThanOrEqual(700)
    // the ledger explains its two derived numbers
    await expect(page.locator('.ledger-key')).toContainText('out of 100')
    await expect(page.locator('.ledger-key')).toContainText('not offered')
  })

  test('without a winner, key differences still compare the eligible picks', async ({ page }) => {
    await page.goto('/?compare=quillo,orbitask')
    await expect(page.getByRole('heading', { name: 'No verdict for this set yet' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Key differences/ })).toBeChecked()
    await expect(page.locator('table.matrix .row-flag')).toHaveCount(0)
  })

  test('team size reprices and can exclude a product from the verdict', async ({ page }) => {
    await page.goto('/?compare=quillo,orbitask&team=3')
    await expect(page.locator('.verdict-title')).toContainText(/Orbitask|Quillo/)
    await page.getByLabel('Team size').fill('10')
    await page.getByLabel('Team size').press('Enter')
    await expect(page.getByRole('heading', { name: 'No verdict for this set yet' })).toBeVisible()
    await expect(page.locator('.verdict-excluded')).toContainText('Quillo')
  })

  test('keyboard only: select two products and reach the comparison', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Skip to the comparison table' }).focus()
    await page.keyboard.press('Enter')
    let found = 0
    for (let i = 0; i < 60 && found < 2; i++) {
      await page.keyboard.press('Tab')
      const isPick = await page.evaluate(() => (document.activeElement as HTMLElement)?.dataset.pick)
      if (isPick) { await page.keyboard.press('Space'); found++ }
    }
    await expect(tray(page)).toContainText('2 of 4')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!.nextElementSibling!).outlineStyle)
    expect(outline).toBe('solid')
  })

  test('visit links, badges, details, related categories and the email form', async ({ page }) => {
    await page.goto('/?compare=northlane,mondray')
    const row = page.locator('tr.lrow', { has: page.getByText('Stackhaven', { exact: true }) })
    // Visit is the row CTA: outbound, new tab, attributed
    const visit = row.getByRole('link', { name: /Visit Stackhaven/ })
    await expect(visit).toHaveAttribute('target', '_blank')
    await expect(visit).toHaveAttribute('rel', /sponsored/)
    await expect(visit).toHaveAttribute('href', /stackhaven\.example.*utm_content=ledger/)
    await expect(row.locator('.badge')).toContainText(['Free version', '14-day free trial', 'AI'])
    // Details moved under the product name and still expands
    const details = row.getByRole('button', { name: 'Details for Stackhaven' })
    await details.click()
    await expect(details).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#details-stackhaven')).toContainText('AI: Automations from plain English')
    // verdict and matrix carry the outbound CTA too
    await expect(page.locator('.verdict').getByRole('link', { name: /^Visit / })).toHaveAttribute('href', /utm_content=verdict/)
    await expect(page.locator('table.matrix thead').getByRole('link', { name: /Visit/ })).toHaveCount(2)
    await expect(page.getByRole('heading', { name: 'Related categories' })).toBeVisible()
    const form = page.locator('.emailme-form')
    await form.getByRole('button', { name: 'Email me the list' }).click()
    await expect(form.getByLabel('Work email')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Work email')).toBeFocused()
    await expect(page.locator('#emailme-error')).toHaveText('Enter your work email.')
    await form.getByLabel('Work email').fill('ana@example.com')
    await form.getByRole('button', { name: 'Email me the list' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'nothing was sent' })).toContainText('ana@example.com')
  })

  test('analytics: the journey emits the tracking contract, with attribution intact and no PII', async ({ page, context }) => {
    // outbound destinations are fictional; answer them locally so the popup URL can be checked
    await context.route(/\.example\//, (r) => r.fulfill({ status: 200, body: 'vendor' }))
    const events = async () => page.evaluate(() => ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? []).map((e) => ({ ...e })))
    const names = async () => (await events()).map((e) => e.event)

    await page.goto('/?compare=northlane')
    await expect.poll(names).toContain('comparison_page_viewed')
    expect((await events())[0]).toMatchObject({ event: 'comparison_page_viewed', from_shared_link: true, selected_ids: ['northlane'], schema_version: 1 })

    await pick(page, 'Taskara').check()
    await tray(page).getByRole('link', { name: /Compare 2/ }).click()
    await page.getByRole('radio', { name: /Complete matrix/ }).check()
    await page.getByLabel('Team size').fill('25')
    await expect.poll(names, { timeout: 4000 }).toContain('team_size_changed')

    const popupPromise = page.waitForEvent('popup')
    await page.locator('.verdict').getByRole('link', { name: /^Visit / }).click()
    const popup = await popupPromise
    expect(popup.url()).toMatch(/^https:\/\/\w+\.example\/\?utm_source=prodcom&utm_medium=compare&utm_content=verdict$/)
    await popup.close()

    await tray(page).getByRole('button', { name: /Remove Taskara/ }).click()
    await page.locator('.emailme-form').getByLabel('Work email').fill('ana@example.com')
    await page.locator('.emailme-form').getByRole('button', { name: 'Email me the list' }).click()

    const all = await events()
    const byName = (n: string) => all.filter((e) => e.event === n)
    expect(byName('product_selected')[0]).toMatchObject({ product_id: 'taskara', slot: 2, source: 'ledger' })
    expect(byName('comparison_started').map((e) => e.trigger)).toContain('tray')
    expect(byName('comparison_view_changed')[0]).toMatchObject({ from: 'key', to: 'all', trigger: 'control' })
    expect(byName('team_size_changed')).toHaveLength(1) // typing "25" settles into one event
    expect(byName('team_size_changed')[0]).toMatchObject({ from: 10, to: 25 })
    const cta = byName('product_cta_clicked')
    expect(cta).toHaveLength(1)
    expect(cta[0]).toMatchObject({ placement: 'verdict', destination_host: `${cta[0].product_id}.example`, comparison_view: 'all', team_size: 25 })
    expect(cta[0].winner_id).toBe(cta[0].product_id)
    expect(byName('product_deselected')[0]).toMatchObject({ product_id: 'taskara', source: 'tray' })
    expect(byName('email_capture_submitted')[0]).toMatchObject({ alerts_opt_in: false })
    // every event shares one page view id, and no event carries the email address
    expect(new Set(all.map((e) => e.page_view_id)).size).toBe(1)
    expect(JSON.stringify(all)).not.toContain('@')
  })

  test('content exists without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.locator('table.ledger-table tbody tr.lrow')).toHaveCount(10)
    await ctx.close()
  })
})

for (const width of [320, 375, 768, 1024, 1280, 1920]) {
  test(`no page-level horizontal overflow at ${width}px with 4 selected`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/?compare=stackhaven,cairnpoint,northlane,orbitask')
    await expect(page.locator('.verdict-title')).toBeVisible()
    await noPageOverflow(page)
    // trigger the full state too
    await pick(page, 'Veloxa').click()
    await expect(page.locator('#tray-full')).toBeVisible()
    await noPageOverflow(page)
  })
}

test('320px: select, hit the limit, and read the verdict', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  for (const name of ['Orbitask', 'Taskara', 'Fernwork', 'Plotwise']) await pick(page, name).click()
  await expect(tray(page)).toContainText('4 of 4')
  // slot names stay exposed to assistive tech even where they are visually hidden
  await expect(tray(page).getByRole('listitem').first()).toContainText('Orbitask')
  await pick(page, 'Mondray').click()
  await expect(page.locator('#tray-full')).toBeFocused()
  await page.getByRole('button', { name: 'Keep these four' }).click()
  await expect(pick(page, 'Mondray')).toBeFocused()
  await expect(page.locator('.stacks')).toBeVisible()
  await expect(page.locator('.stack-key li[data-best]')).toHaveCount(1)
  // phones get the same three levels; key differences hold no identical rows
  await expect(page.getByRole('radio', { name: /Key differences/ })).toBeChecked()
  await expect(page.locator('.stacks .srow[data-status="same"]')).toHaveCount(0)
  await expect(page.locator('.stacks .srow .row-flag').first()).toBeVisible()
  // rows identical for every pick are stated once, not repeated per product
  await page.getByRole('radio', { name: /Complete matrix/ }).check()
  await expect(page.locator('.stacks .srow[data-status="same"] .srow-same').first()).toContainText('Same for all 4')
  // the section index replaces the select that navigated on arrow keys (WCAG 3.2.2)
  await expect(page.locator('.stacks select')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Comparison sections' }).getByRole('link', { name: /Platforms/ }).click()
  await expect(page.locator('#s-platforms')).toBeFocused()
})

test('400% zoom equivalent: the tray never covers a focused checkbox', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 })
  await page.goto('/?compare=northlane,mondray')
  const box = pick(page, 'Taskara')
  await box.focus()
  const covered = await page.evaluate(() => {
    const el = document.activeElement!.getBoundingClientRect()
    const tray = document.querySelector('.tray')!.getBoundingClientRect()
    return el.bottom > tray.top && el.top < tray.bottom && tray.top < innerHeight
  })
  expect(covered).toBe(false)
})

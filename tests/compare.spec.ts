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

    // the "All differences" view hides identical rows
    const rows = await page.locator('table.matrix tbody tr:not(.m-group)').count()
    await page.getByRole('radio', { name: /All differences/ }).check()
    expect(await page.locator('table.matrix tbody tr:not(.m-group)').count()).toBeLessThan(rows)

    // clear
    await tray(page).getByRole('button', { name: 'Clear all' }).click()
    await expect(tray(page)).toContainText('0 of 4')
    expect(errors).toEqual([])
  })

  test('evidence is ranked against the winner and reachable from the verdict', async ({ page }) => {
    await page.goto('/?compare=northlane,taskara')
    const views = page.getByRole('group', { name: 'Show rows' })
    await expect(views.getByRole('radio', { name: /Everything/ })).toBeChecked()
    const matrixRows = page.locator('table.matrix tbody tr:not(.m-group)')
    const everything = await matrixRows.count()

    // the verdict leads to the rows where the winner is behind
    await page.getByRole('button', { name: 'See where Northlane is behind' }).click()
    await expect(views.getByRole('radio', { name: /Where Northlane is behind/ })).toBeChecked()
    await expect(page.locator('#view-control')).toBeFocused()
    const behind = await matrixRows.count()
    expect(behind).toBeGreaterThan(0)
    expect(behind).toBeLessThan(everything)
    // every row in that view says so in text, and the option states the same count
    await expect(page.locator('table.matrix tbody tr:not(.m-group) .row-flag')).toHaveCount(behind)
    await expect(views.getByRole('radio', { name: /Where Northlane is behind/ })).toHaveAccessibleName(new RegExp(`${behind} rows`))

    // every group still announces itself, even when empty in this view
    await expect(page.locator('table.matrix .m-group')).toHaveCount(10)

    // a trade-off reason links to its evidence group
    await page.getByRole('link', { name: 'See the price rows' }).click()
    await expect(page.locator('#m-price-cost')).toBeFocused()

    // back to the full dataset
    await views.getByRole('radio', { name: /Everything/ }).check()
    await expect(matrixRows).toHaveCount(everything)
  })

  test('the behind view is complete, names who leads, and survives a shared link', async ({ page }) => {
    await page.goto('/?compare=northlane,taskara&view=behind')
    await expect(page.getByRole('radio', { name: /Where Northlane is behind/ })).toBeChecked()
    // the verdict cites Taskara's quicker setup, so that row must be in the behind view, naming Taskara
    const setup = page.locator('table.matrix tbody tr', { has: page.getByRole('rowheader', { name: /Typical setup/ }) })
    await expect(setup.locator('.row-flag')).toHaveText('Northlane behind Taskara')
    // score areas summarise other rows and are not double-counted here
    await expect(page.locator('#m-score')).toContainText('Score areas summarise the rows below')
    // an empty group never claims more than the ranking shows
    await expect(page.locator('#m-fit')).toContainText('not behind on any ranked row')
    // switching back to Everything drops the view from the URL
    await page.getByRole('radio', { name: /Everything/ }).check()
    await expect(page).not.toHaveURL(/view=/)
    await page.getByRole('radio', { name: /All differences/ }).check()
    await expect(page).toHaveURL(/compare=northlane,taskara.*view=diff|view=diff.*compare=northlane,taskara/)
  })

  test('no "behind" view without a winner', async ({ page }) => {
    await page.goto('/?compare=quillo,orbitask')
    await expect(page.getByRole('heading', { name: 'No verdict for this set yet' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /is behind/ })).toHaveCount(0)
    await expect(page.getByRole('radio', { name: /Everything/ })).toBeChecked()
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
  // rows identical for every pick are stated once, not repeated per product
  await expect(page.locator('.stacks .srow[data-status="same"] .srow-same').first()).toContainText('Same for all 4')
  // the behind view works on phones and every visible row is flagged
  await page.getByRole('radio', { name: /is behind/ }).check()
  const stackRows = page.locator('.stacks .srow')
  await expect(stackRows.first()).toBeVisible()
  await expect(page.locator('.stacks .srow .row-flag')).toHaveCount(await stackRows.count())
})

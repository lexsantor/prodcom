import { expect, test, type Page } from '@playwright/test'

// Every tray control must receive the pointer at its centre. Run it against the deployed site too
// (PLAYWRIGHT_BASE_URL): hosts inject fixed overlays (e.g. Netlify's badge) that local preview never has.
// Non-destructive: the app keeps state in the URL and localStorage only.

const tray = (page: Page) => page.getByRole('region', { name: 'Your comparison' })
const pick = (page: Page, name: string) => page.getByRole('checkbox', { name: `Compare ${name}` }).locator('visible=true')

/** Wait for late, host-injected overlays to mount, so the hit test sees the page a visitor sees. */
async function settled(page: Page) {
  await page.waitForLoadState('networkidle')
  // Netlify's injected HUD script marks its frame ready once sized; absent locally and when the badge is off.
  if (await page.locator('script[data-nf-variant]').count()) {
    await page.locator('iframe[data-nl-ready]').waitFor({ state: 'attached', timeout: 10_000 })
  }
}

/** Controls whose centre point belongs to some other element. */
async function blockedControls(page: Page) {
  return page.locator('.tray').evaluate((t) =>
    [...t.querySelectorAll<HTMLElement>('button, a[href]')]
      .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => {
        const r = el.getBoundingClientRect()
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        const name = el.getAttribute('aria-label') || el.textContent!.trim()
        return el.contains(hit) ? null : `${name} -> ${hit ? hit.tagName.toLowerCase() + (hit.id ? '#' + hit.id : '') : 'outside viewport'}`
      })
      .filter(Boolean),
  )
}

for (const [width, height] of [[1440, 900], [1280, 800], [768, 1024], [375, 812]]) {
  test(`${width}px: every tray control takes the pointer; remove, compare and clear all work`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await settled(page)
    for (const name of ['Northlane', 'Mondray', 'Taskara', 'Fernwork']) await pick(page, name).check()
    await expect(tray(page).locator('.tray-count')).toContainText('4 of 4')
    expect(await blockedControls(page)).toEqual([])

    // real clicks, no force: an overlay makes them fail
    // phones (<600px) have no per-slot remove; removal there is unticking the product
    const remove = tray(page).getByRole('button', { name: 'Remove Fernwork from the comparison' })
    if (width >= 600) await remove.click({ timeout: 3000 })
    else {
      await expect(remove).toBeHidden()
      await pick(page, 'Fernwork').uncheck({ timeout: 3000 })
    }
    await expect(tray(page).locator('.tray-count')).toContainText('3 of 4')
    await expect(pick(page, 'Fernwork')).not.toBeChecked()

    await tray(page).getByRole('link', { name: /Compare 3/ }).click({ timeout: 3000 })
    await expect(page).toHaveURL(/#compare$/)
    await expect(page.locator('#compare-title')).toBeFocused()

    // back to the ledger, where the tray is pinned, then empty it
    await pick(page, 'Northlane').scrollIntoViewIfNeeded()
    expect(await blockedControls(page)).toEqual([])
    await tray(page).getByRole('button', { name: 'Clear all' }).click({ timeout: 3000 })
    await expect(tray(page).locator('.tray-count')).toContainText('0 of 4')
    await expect(page.locator('input[data-pick]:checked')).toHaveCount(0)
  })
}

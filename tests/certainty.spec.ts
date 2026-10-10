import { expect, test, type Page } from '@playwright/test'
import { FOUR } from './helpers.ts'

// UX-1 / UX-2: how certain the winner is (tie, narrow lead, lead) and where its score comes from.
// Fixtures from the real model: Orbitask and Taskara tie on 68 for 10 (Orbitask rated higher); Northlane leads Mondray
// by 2 for 10; Northlane leads Taskara by 6 for 10; Fernwork, Taskara and Cairnpoint all score 68 for 31.

const TIE = '/?compare=orbitask,taskara&team=10'
const NARROW = `${FOUR}&team=10` // Northlane 74, Mondray 72, Fernwork 70, Taskara 68
const LEAD = '/?compare=northlane,taskara&team=10'
const TIE3 = '/?compare=fernwork,taskara,cairnpoint&team=31'

const head = (page: Page, name: string) => page.locator('table.matrix th.m-head', { hasText: name })
const why = (page: Page) => page.locator('.verdict-why')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('tie: labelled as tied, the rule that broke it stated, never a lead, one winner', async ({ page }) => {
    await page.goto(TIE)
    await expect(page.locator('.verdict-kicker')).toHaveText('Best overall, tied on score: first on the tie-break among your 2, for a team of 10')
    await expect(why(page)).toContainText('Orbitask and Taskara both score 68. Ties go to the higher user rating, then the lower price, then name order: Orbitask is rated 4.8, against 4.2 for Taskara.')
    await expect(why(page)).not.toContainText(/ahead|narrow lead/)
    await expect(page.locator('table.matrix thead th[data-best]')).toHaveCount(1)
    await expect(head(page, 'Orbitask')).toContainText('Best overall')
    await expect(head(page, 'Orbitask').locator('.best-qual')).toHaveText(', Tied on score')
    await expect(head(page, 'Taskara').locator('.contender-tag')).toHaveText('Tied on score')
    // the tied runner-up is not painted like a winner
    const bg = await head(page, 'Taskara').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toBe(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor))
    await expect(page.locator('table.matrix caption')).toContainText('Orbitask is best overall on the tie-break; it ties Taskara on 68.')
  })

  test('narrow lead with four picks: the gap in the header, the close pick tagged, the others not', async ({ page }) => {
    await page.goto(NARROW)
    await expect(page.locator('.verdict-kicker')).toHaveText('Best overall, narrow lead: the highest Prodcom score of your 4, for a team of 10')
    await expect(why(page)).toContainText('It scores 74, 2 points ahead of Mondray: a narrow lead, so what matters most to your team can change the choice.')
    await expect(head(page, 'Northlane').locator('.best-qual')).toHaveText(', Narrow lead by 2 points')
    await expect(head(page, 'Mondray').locator('.contender-tag')).toHaveText('2 points behind')
    await expect(head(page, 'Taskara').locator('.contender-tag')).toHaveCount(0)
    await expect(head(page, 'Fernwork').locator('.contender-tag')).toHaveCount(0)
    await expect(page.locator('table.matrix caption')).toContainText('Northlane is best overall, a narrow lead of 2 points over Mondray.')
  })

  test('a lead of 3 or more keeps the plain "Best overall" and claims nothing more', async ({ page }) => {
    await page.goto(LEAD)
    await expect(page.locator('.verdict-kicker')).toHaveText('Best overall: the highest Prodcom score of your 2, for a team of 10')
    await expect(why(page)).toContainText('It scores 74, 6 points ahead of Taskara.')
    await expect(page.locator('.verdict')).not.toContainText(/narrow|tied|significant|decisive|certain/i)
    await expect(head(page, 'Northlane').locator('.best-qual')).toHaveCount(0)
    await expect(page.locator('table.matrix .contender-tag')).toHaveCount(0)
    await expect(page.locator('table.matrix caption')).toContainText('Northlane is best overall.')
  })

  test('three-way tie: every tied pick named and tagged, each tie-break stated', async ({ page }) => {
    await page.goto(TIE3)
    await expect(why(page)).toContainText('Fernwork, Taskara and Cairnpoint all score 68. Ties go to the higher user rating, then the lower price, then name order: Fernwork is rated 4.6, against 4.2 for Taskara and 3.9 for Cairnpoint.')
    await expect(page.locator('table.matrix .contender-tag')).toHaveText(['Tied on score', 'Tied on score'])
    await expect(page.locator('table.matrix caption')).toContainText('it ties Taskara and Cairnpoint on 68.')
  })

  test('the breakdown: winner against runner-up, one decimal, before rounding, from the score itself', async ({ page }) => {
    await page.goto('/?compare=northlane,mondray&team=10')
    const gains = (name: string) => page.getByRole('list', { name: `${name} gains` }).getByRole('listitem')
    await expect(page.locator('.breakdown h4')).toHaveText('How Northlane and Mondray compare, area by area')
    await expect(gains('Northlane')).toHaveText(['Value for your team+4.6 points', 'Ease of adoption+4.5 points', 'User rating+3.0 points'])
    await expect(gains('Mondray')).toHaveText(['Support+4.0 points', 'Capability+3.3 points', 'Admin and security+2.5 points'])
    await expect(page.locator('.breakdown-note')).toHaveText('Points out of 100, before rounding, so they may not add up to the 2-point gap between the rounded scores.')
    // two picks: the breakdown already covers both, so no link to the matrix
    await expect(page.getByRole('button', { name: 'Compare all six areas for every pick' })).toHaveCount(0)
    await page.goto(TIE)
    await expect(page.locator('.breakdown-note')).toContainText('the tie is settled by the rule above, not by these points')
    await expect(page.locator('.breakdown-even')).toHaveText('Even: ease of adoption and support.')
  })

  test('from the breakdown to every pick\'s area scores: complete matrix, focus on the score group, shareable', async ({ page }) => {
    await page.goto(NARROW)
    const rowsBefore = await page.locator('.view-opt', { hasText: 'Key differences' }).locator('.view-count').innerText()
    const go = page.getByRole('button', { name: 'Compare all six areas for every pick' })
    await go.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('radio', { name: /Complete matrix/ })).toBeChecked()
    await expect(page.locator('#m-score')).toBeFocused()
    await expect(page.locator('table.matrix tbody tr', { has: page.locator('th', { hasText: /^Capability/ }) })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Showing the complete matrix: 51 rows. The six score areas are under Prodcom score.')
    await expect(page).toHaveURL(/view=all/)
    expect(rowsBefore).toMatch(/^34/) // the default view's row count is unchanged
  })

  test('team size moves the certainty and says so; the URL restores it', async ({ page }) => {
    await page.goto(TIE)
    await expect(head(page, 'Orbitask').locator('.best-qual')).toHaveText(', Tied on score')
    await page.getByLabel('Team size').fill('100')
    await page.getByLabel('Team size').press('Enter')
    await expect(page.getByRole('status')).toHaveText('Prices and scores updated for a team of 100. Best overall: Taskara, a narrow lead of 2 points.')
    await expect(head(page, 'Taskara').locator('.best-qual')).toHaveText(', Narrow lead by 2 points')
    await expect(head(page, 'Orbitask').locator('.contender-tag')).toHaveText('2 points behind')
    await expect(page).toHaveURL(/team=100/)
    await page.reload()
    await expect(head(page, 'Taskara').locator('.best-qual')).toHaveText(', Narrow lead by 2 points')
    await expect(why(page)).toContainText('It scores 68, 2 points ahead of Orbitask')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('sticky key: shorthand on screen, the full label for screen readers; full labels in the Visit list', async ({ page }) => {
    await page.goto(TIE3)
    const key = page.getByRole('list', { name: 'Your picks', exact: true })
    const best = key.locator('li[data-best]')
    await expect(best.locator('.key-qual')).toHaveText('· tied')
    await expect(best.locator('.best-label .sr-only')).toHaveText(' overall, Tied on score')
    await expect(key.locator('.contender-tag [aria-hidden="true"]')).toHaveText(['Tied', 'Tied'])
    await expect(key.locator('.contender-tag .sr-only')).toHaveText(['Tied on score', 'Tied on score'])
    const visits = page.getByRole('list', { name: 'Vendor sites for your picks' })
    await expect(visits.locator('li[data-best] .best-qual')).toHaveText(', Tied on score')

    await page.goto(NARROW)
    await expect(key.locator('li[data-best] .key-qual')).toHaveText('· by 2 pts')
    await expect(key.locator('li', { hasText: 'Mondray' }).locator('.contender-tag')).toHaveText('−2 pts2 points behind')
    await expect(key.locator('li', { hasText: 'Taskara' }).locator('.contender-tag')).toHaveCount(0)
  })

  test('the breakdown button lands on the phone score group', async ({ page }) => {
    await page.goto(NARROW)
    await page.getByRole('button', { name: 'Compare all six areas for every pick' }).click()
    await expect(page.locator('#s-score')).toBeFocused()
    await expect(page.locator('.sgroup', { has: page.locator('#s-score') }).locator('.srow')).toHaveCount(7) // overall + six areas
  })

  for (const width of [320, 375]) {
    test(`${width}px: labels and breakdown fit, nothing clipped, no page overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      for (const q of [TIE3, NARROW]) {
        await page.goto(q)
        const problems = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.best-label, .best-qual, .contender-tag, .breakdown li, .stack-key li')]
          .filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent))
        expect(problems).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    })
  }
})

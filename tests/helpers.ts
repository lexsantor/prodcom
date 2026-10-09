import type { Page } from '@playwright/test'

export const FOUR = '/?compare=northlane,mondray,taskara,fernwork'
export const tray = (page: Page) => page.getByRole('region', { name: 'Your comparison' })
export const pick = (page: Page, name: string) => page.getByRole('checkbox', { name: `Compare ${name}` }).locator('visible=true')

/** Wait for late, host-injected overlays to mount, so measurements see the page a visitor sees. */
export async function settled(page: Page) {
  await page.waitForLoadState('networkidle')
  // Netlify's injected HUD script marks its frame ready once sized; absent locally and when the badge is off.
  if (await page.locator('script[data-nf-variant]').count()) {
    await page.locator('iframe[data-nl-ready]').waitFor({ state: 'attached', timeout: 10_000 })
  }
}

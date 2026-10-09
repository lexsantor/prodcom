import { defineConfig } from '@playwright/test'

// Local preview by default. Set PLAYWRIGHT_BASE_URL to run the same suite against a deployed site
// (e.g. production), where host-injected overlays exist that local preview never renders.
const deployed = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: deployed ?? 'http://localhost:4173' },
  webServer: deployed
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
      },
})

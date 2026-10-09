# Prodcom

Demo comparison page for ten fictional project-management tools: tick up to four, see them priced for your team size, and read a head-to-head with a transparent best-overall score. Every product, price and rating is invented.

Vite + React + TypeScript, plain CSS. The build prerenders the page, so the full table is in the HTML before JavaScript runs.

## Commands

```sh
npm ci
npm run dev        # local dev server
npm run build      # typecheck, build and prerender to dist/client
npm test           # logic unit tests (node --test)
npx playwright test  # E2E against the built site (run npm run build first)
PLAYWRIGHT_BASE_URL=https://prodcom-v1.netlify.app npx playwright test  # same suite against production (read-only)
```

## Deploy (Netlify)

`netlify.toml` sets everything: build command `npm run build`, publish directory `dist/client`, Node 24. Connect the repository or drag `dist/client` into Netlify after a local build.

## Docs

- `docs/analytics/tracking-plan.md`: analytics event contract (`window.dataLayer`).
- `docs/cro/experiment-plan.md`: funnel audit and experiment backlog.
- `.design/context.md`: design decisions and their history.

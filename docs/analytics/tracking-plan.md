# Prodcom tracking plan (contract v1)

Source of truth for the events emitted by `src/lib/track.ts`. Change this file and `SCHEMA_VERSION` together.

## Status

- **Emitted today:** to `window.dataLayer` only. No tag manager, analytics vendor, consent platform or backend exists in this repository, so nothing leaves the browser.
- **Environment:** demo. Every product, price, rating and destination URL (`https://<id>.example/`) is fictional. No commercial agreement, revenue or margin data exists in the repo.
- **Not emitted by the frontend:** `attributed_conversion` (server-side; spec below).

## Envelope (every event)

| Field | Type | Notes |
|---|---|---|
| `event` | string | event name below |
| `schema_version` | 1 | bump on any breaking change |
| `page_view_id` | string | random per page load, memory only; joins one visit's events. Not a user or session id |
| `ts` | ISO 8601 | client time |
| `team_size` | int 1–500 | current team size |
| `selected_ids` / `selected_count` | string[] / int | products in the comparison, slot order |
| `winner_id` | string \| null | current "best overall", null with no verdict |
| `comparison_view` | `key` \| `essential` \| `all` \| null | null below 2 picks |

Product ids are the stable dataset ids (`northlane`, `taskara`, ...). Events naming an unknown product id are dropped.

## Events

| Event | Fires when | Own fields |
|---|---|---|
| `comparison_page_viewed` | after hydration, once per page load | `from_shared_link` (URL had `compare`) |
| `team_size_changed` | a team-size adjustment settles (1 s debounce, so typing "25" is one event) | `from`, `to` |
| `product_selected` | a product enters the comparison | `product_id`, `slot` (1–4), `source`: `ledger` \| `replace` \| `suggestion` \| `top-three` |
| `product_deselected` | a product leaves | `product_id`, `source`: `ledger` \| `tray` \| `matrix` \| `replace` \| `clear` |
| `comparison_full_blocked` | a fifth product is ticked (the 4-limit) | `product_id` |
| `comparison_started` | "Compare N" clicked (`trigger: tray`), or the head-to-head scrolls into view with 2+ picks (`trigger: scroll`, once per distinct set) | `trigger` |
| `comparison_view_changed` | the view control changes, or the verdict's "See where X is behind" switches to key | `from`, `to`, `rows`, `trigger`: `control` \| `verdict` |
| `product_cta_clicked` | any Visit link is clicked | `product_id`, `placement`: `ledger` \| `ledger-card` \| `verdict` \| `matrix`, `destination_host` |
| `comparison_shared` | the comparison link is copied successfully | `method: copy_link` |
| `email_capture_submitted` | the email form passes validation | `alerts_opt_in`. The address is never sent to analytics |
| `comparison_section_expanded` | **not implemented**: the page has no collapsible sections (accordions were rejected in the UX audit); section-index jumps are not tracked | — |

## Rules

- **Deduplication:** an identical event payload within 800 ms is dropped (double clicks, re-renders). Server-side deduplication of conversions is by `click_id` (below).
- **Error handling:** `track()` never throws; analytics failure cannot break the page.
- **No sensitive data:** no email, name, free text, IP-derived data, prices paid, commission or margin. Margin data must never reach the frontend.
- **Consent:** the module stores nothing and sends nothing. The site's consent platform and tag manager must gate every tag that reads `dataLayer` (for example Consent Mode or an equivalent). Required before production traffic.
- **Validation:** `npm test` checks the envelope, unknown-id dropping and dedupe. The E2E "analytics" test walks the journey and checks event order, fields, one `page_view_id`, no `@` in any event, and the outbound URL.

## Attribution (current and required)

- **Current:** outbound URLs carry `utm_source=prodcom&utm_medium=compare&utm_content=<placement>`, `rel="sponsored noopener"`, new tab. Unchanged by this contract.
- **Missing (blocks Gross Profit measurement):** a per-click id joining a click to a vendor conversion.
  - Spec: generate `click_id` (UUID) at click time.
  - Add it to `product_cta_clicked` and to the destination URL in the affiliate network's own sub-id parameter. The parameter name depends on each network: verify it, never guess.
  - Import conversions by `click_id` from network postbacks or reports.

## `attributed_conversion` (server-side spec)

Source: affiliate network postback or report import, never the browser.

| Field | Notes |
|---|---|
| `click_id` | joins to `product_cta_clicked` |
| `product_id`, `network`, `conversion_type` (`trial`, `paid`, `lead`, ...) | from the network |
| `revenue`, `currency`, `status` (`pending` \| `approved` \| `reversed`), `event_time`, `reported_time` | revenue is recognised on `approved`; reversals and refunds net off |

Gross Profit = approved revenue − direct costs (network fees, paid acquisition attributable to the session, if any), computed in the warehouse. It is never exposed client-side.

## Experiment assignment (when a platform exists)

Add `experiments: { <experiment_key>: <variant> }` to the envelope from the platform's assignment API. Assign once per visitor before first render to avoid flicker, and log an exposure event when the treated element renders. Not implemented: there is no platform to read from.

# Prodcom tracking plan (contract v2)

Source of truth for the events emitted by `src/lib/track.ts`. Change this file and `SCHEMA_VERSION` together.

## Status

> **Scope (2026-10-10, U-6):** Prodcom is a fictional side project and product-design portfolio demonstration, not a live business. CVR, VCVR and Gross Profit are conceptual business metrics; nothing in this contract is a measured outcome. Analytics providers (PostHog, GA4, GTM or any other), consent management platforms, revenue attribution, affiliate postbacks and live commercial A/B testing are **out of scope**. Sections that depend on them are kept as design reasoning, not as a plan.

- **Implemented:** contract v2 (envelope, events, rules below), emitted by `src/lib/track.ts` and covered by unit and E2E tests. **Reference only:** `click_id`, `attributed_conversion` and experiment assignment at the end of this file.
- **Emitted today:** to `window.dataLayer` only. No tag manager, analytics vendor, consent platform or backend exists in this repository, so nothing leaves the browser.
- **Environment:** demo. Every product, price, rating and destination URL (`https://<id>.example/`) is fictional. No commercial agreement, revenue or margin data exists in the repo.
- **Not implemented anywhere:** `attributed_conversion` (hypothetical server-side event; reference-only spec below).

## Version history

- **v2 (2026-10-10, Phase C0):** `table_sort` in the envelope; `display_position` and `rank_position` on clicks and selections; `eligible` on clicks; placement `stack`; `comparison_started` redefined (entry, once per set, shared registry, `link` trigger). **Do not trend `comparison_started` across v1 and v2:** v1 missed scroll entries on most phones and tablets and counted "Compare N" twice on desktop. No v1 data was ever collected in production (no tag manager), so nothing is lost.
- **v1 (2026-10-09):** first contract.

## Envelope (every event)

| Field | Type | Notes |
|---|---|---|
| `event` | string | event name below |
| `schema_version` | 2 | bump on any breaking change, including a change of meaning |
| `page_view_id` | string | random per page load, memory only; joins one visit's events. Not a user or session id |
| `ts` | ISO 8601 | client time |
| `team_size` | int 1–500 | current team size |
| `selected_ids` / `selected_count` | string[] / int | products in the comparison, slot order |
| `winner_id` | string \| null | current "best overall", null with no verdict |
| `comparison_view` | `key` \| `essential` \| `all` \| null | null below 2 picks |
| `table_sort` | `score` \| `price` \| `rating` \| `features` \| `name` | the table's active sort when the event fired |

Product ids are the stable dataset ids (`northlane`, `taskara`, ...). Events naming an unknown product id are dropped.

## Events

| Event | Fires when | Own fields |
|---|---|---|
| `comparison_page_viewed` | after hydration, once per page load | `from_shared_link` (URL had `compare`) |
| `team_size_changed` | a team-size adjustment settles (1 s debounce, so typing "25" is one event) | `from`, `to` |
| `product_selected` | a product enters the comparison | `product_id`, `slot` (1–4), `source`: `ledger` \| `replace` \| `suggestion` \| `top-three`, `display_position`, `rank_position` (below) |
| `product_deselected` | a product leaves | `product_id`, `source`: `ledger` \| `tray` \| `matrix` \| `replace` \| `clear` |
| `comparison_full_blocked` | a fifth product is ticked (the 4-limit) | `product_id` |
| `comparison_started` | the user **entered** the head-to-head for a set of 2+ picks; rules below | `trigger`: `tray` \| `scroll` \| `link` |
| `comparison_view_changed` | the view control changes, or the verdict's "See where X is behind" switches to key | `from`, `to`, `rows`, `trigger`: `control` \| `verdict` |
| `product_cta_clicked` | any Visit link is clicked | `product_id`, `placement`: `ledger` \| `ledger-card` \| `verdict` \| `matrix` \| `stack`, `destination_host`, `display_position`, `rank_position`, `eligible` (below) |
| `comparison_shared` | the comparison link is copied successfully | `method: copy_link` |
| `email_capture_submitted` | the email form passes validation | `alerts_opt_in`. The address is never sent to analytics |
| `comparison_section_expanded` | **not implemented**: the page has no collapsible sections (accordions were rejected in the UX audit); section-index jumps are not tracked | — |

### `comparison_started` (v2)

- **Once per distinct set of picks per page view** (set = sorted ids), whichever trigger comes first. All triggers share one registry (`startComparison` in `track.ts`); re-entering the same set never fires again, a changed set entered again does.
- **Never for fewer than two picks.** "See alternatives" with one pick jumps to the section but does not fire.
- `tray`: "Compare N" pressed. `scroll`: the head-to-head heading (small, fixed height) enters the upper half of the viewport; it does not depend on how tall the comparison is. `link`: the page was opened on `#compare` with 2+ picks and the heading is in view.
- Rendering alone never fires it: a shared `?compare=` link without the hash fires nothing until the user scrolls or presses Compare.
- Direct exit = `product_cta_clicked` from `ledger`/`ledger-card` with no `comparison_started` earlier in the page view; assisted exit = with one.

### Position and eligibility fields (v2)

| Field | On | Meaning |
|---|---|---|
| `display_position` | `product_cta_clicked`, `product_selected` | 1–10, the row's position in the table **as displayed** (current sort); null outside the table (`verdict`, `matrix`, `stack`, suggestions, replace) |
| `rank_position` | `product_cta_clicked`, `product_selected` | 1–N, position in the **recommendation order** (products that can serve the team, by score, rating, lower price, name) for `team_size`; null when the product cannot serve the team |
| `eligible` | `product_cta_clicked` | the product can serve `team_size` (seat cap) |

`display_position` and `rank_position` differ whenever the table is sorted by anything but score; that difference separates screen position from the recommendation's pull. Neither goes into the outbound URL: they are internal analytics, not vendor-facing parameters. Winner and comparison membership stay derivable (`winner_id`, `selected_ids`).

## Rules

- **Deduplication:** an identical event payload within 800 ms is dropped (double clicks, re-renders). Server-side deduplication of conversions is by `click_id` (below).
- **Error handling:** `track()` never throws; analytics failure cannot break the page.
- **No sensitive data:** no email, name, free text, IP-derived data, prices paid, commission or margin. Margin data must never reach the frontend.
- **Consent:** the module stores nothing and sends nothing, so no consent is needed for it as shipped. If this contract were ever connected to a real tag manager, a consent platform would have to gate every tag that reads `dataLayer`. Not planned (U-6).
- **Validation:** `npm test` checks the envelope, unknown-id dropping and dedupe. The E2E "analytics" test walks the journey and checks event order, fields, one `page_view_id`, no `@` in any event, and the outbound URL.

## Attribution (implemented UTMs; `click_id` reference only)

- **Current:** outbound URLs carry `utm_source=prodcom&utm_medium=compare&utm_content=<placement>`, `rel="sponsored noopener"`, new tab. v2 adds only the placement value `stack` (phone and tablet head-to-head).
- **Not built, out of scope (U-6):** a per-click id joining a click to a vendor conversion. Kept as a reference design of how Gross Profit would be made measurable in a real product.
  - Spec: generate `click_id` (UUID) at click time.
  - Add it to `product_cta_clicked` and to the destination URL in the affiliate network's own sub-id parameter. The parameter name depends on each network: verify it, never guess.
  - Import conversions by `click_id` from network postbacks or reports.

## `attributed_conversion` (server-side spec, reference only)

> Not built and not planned (U-6). Kept to show how conversions and Gross Profit would be reconciled in a real product.

Source: affiliate network postback or report import, never the browser.

| Field | Notes |
|---|---|
| `click_id` | joins to `product_cta_clicked` |
| `product_id`, `network`, `conversion_type` (`trial`, `paid`, `lead`, ...) | from the network |
| `revenue`, `currency`, `status` (`pending` \| `approved` \| `reversed`), `event_time`, `reported_time` | revenue is recognised on `approved`; reversals and refunds net off |

Gross Profit = approved revenue − direct costs (network fees, paid acquisition attributable to the session, if any), computed in the warehouse. It is never exposed client-side.

## Experiment assignment (reference only)

Add `experiments: { <experiment_key>: <variant> }` to the envelope from the platform's assignment API. Assign once per visitor before first render to avoid flicker, and log an exposure event when the treated element renders. Not implemented and not planned (U-6).

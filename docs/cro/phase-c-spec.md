# Prodcom V3: Phase C0 + C1 specification

Date: 2026-10-10. **Specification only.** No code, commit, push or deploy. Input: `docs/cro/phase-c-audit.md`.

> **Scope (2026-10-10, U-6):** Prodcom is a fictional side project and product-design portfolio demonstration, not a live business. CVR, VCVR and Gross Profit are conceptual business metrics; nothing in this document is a measured outcome. Analytics providers (PostHog, GA4, GTM or any other), consent management platforms, revenue attribution, affiliate postbacks and live commercial A/B testing are **out of scope**. Sections that depend on them are kept as design reasoning, not as a plan.
> **Outcome:** sections 1–3 (C1-A, C1-B, C0-A) were implemented and shipped in 46854fd. Section 4 (C0-B) is closed as out of scope and kept only as reference reasoning.
Repository verified: `main` = `origin/main` = `750733e`; the only untracked files are the two `docs/cro/` documents from this phase. Production serves the build of `750733e` (asset hashes match a fresh local build).

New evidence gathered for this spec (production, Chromium):
- All six Related-category URLs return 404 (`time-tracking`, `resource-management`, `team-collaboration`, `agency-management`, `portfolio-management`, `kanban-boards`).
- **`comparison_started` is biased in both directions.** At 1440×900, ticking two products and pressing "Compare 2" logs `tray` **and** `scroll` for the same set (double count). At 375×812 with 4 picks it logs nothing on scroll (undercount, audit F2).
- With one pick, the tray's "See alternatives" link calls the same `jumpToCompare` and logs `comparison_started` (`tray`) for a one-product "comparison" (code: `Tray.tsx`).
- Only one product has a seat cap (Quillo, `maxSeats: 5`). `minSeats` (Northlane 3, Plotwise 10) bills a minimum and never makes a product ineligible.

Each change carries a **C→D→A** line: how it serves COMPARE → DECIDE → ADVANCE.

---

## 1. C1-A decision contract: ranking and eligibility

### 1.1 Ranking order (one comparator, every recommendation surface)

The rule is already published on the page (Method: "Equal scores are decided by user rating, then lower price, then name") and implemented in `compareScored` (`src/lib/score.ts`). No other business rule exists in the repo, so this spec adopts the published rule as the contract. It is an editorial rule; if the business owner wants a different one, the Method copy and this comparator change together.

**`compareScored(a, b)`, total order:**

| Step | Key | Direction | Notes |
|---|---|---|---|
| 0 | `cost.eligible` | eligible first | **new**; see 1.2 |
| 1 | `overall` (the rounded integer shown) | descending | **only when both are eligible**; ineligible products have no score to compare |
| 2 | `product.rating` (one decimal in data) | descending | |
| 3 | `cost.total` (monthly, billed yearly, for the current team) | ascending | |
| 4 | `product.name` | ascending, `localeCompare(…, 'en')` | `'en'` pins it across browser locales |

- **Nulls:** none can occur. Every product has a numeric rating and a computed `cost.total` (the dataset test asserts this). There are no "unavailable prices": a product that cannot serve the team is *ineligible*, handled by step 0, not by a missing price.
- **Stability:** names are unique (existing test), so the order is total and never depends on sort stability or catalogue order.
- **Ties are rounded ties:** step 1 compares the displayed integer, so "68 vs 68" on screen is a tie in the rule too.

**Where the code diverges today (verified):**

| # | Surface | Today | Contract |
|---|---|---|---|
| R1 | Table, "Score" sort (`Ledger.tsx` `SORTS.score`) | `overall` only, then catalogue order. Team 10: Taskara above Orbitask; team 100: Taskara above Fernwork | `compareScored` |
| R2 | Table, other sorts (price, rating, features, name) | primary key, then `overall`, then catalogue order | primary key, then `compareScored` (factual sorts stay factual; ties fall back to the published order) |
| R3 | Table, ineligible product under "Score" | sorted by its artefact score (38) | after all eligible products (step 0) |
| — | Verdict, "Try the top three", one-pick suggestions | already `compareScored` on eligible products | unchanged; the step-0 addition is a no-op there |

Price sort already places ineligible products last; rating, features and name sorts keep them in factual position (they are facts about the product, not recommendations).

**C→D→A:** the table and the verdict can no longer disagree about who is ahead (DECIDE); a stable, published order makes the table itself a trustworthy shortlist (COMPARE).

### 1.2 Eligibility

**Definition (unchanged):** eligible ⇔ `pricing.maxSeats` is undefined or `team ≤ maxSeats`. A seat *minimum* never makes a product ineligible; it is shown in the price arithmetic.

**Behaviour for an ineligible product, by surface:**

| Surface | Today | Contract |
|---|---|---|
| Table score cell / card score | "38 / 100" | "Not scored" (visible), with the reason for screen readers: "Not scored for a team of 10: supports at most 5 seats". No number. |
| Table price cell | "Not available for 10 · Supports at most 5 seats" | unchanged (factual) |
| Rating, coverage, strengths, Details | shown | unchanged (factual information stays available) |
| Table position under Score sort | by artefact score | after every eligible product |
| Selection checkbox | selectable | unchanged: never removed, never disabled |
| Visit (table row and card) | solid ink | **quiet** variant; accessible name "Visit Quillo, supports at most 5 seats (opens in a new tab)". Visible context is the price cell in the same row. |
| Head-to-head header | "Can't serve 10" + "38 / 100" | "Can't serve 10" + "Not scored" |
| Matrix and stacks, "Prodcom score" group (overall + six areas) | numbers, value area 0 | "Not scored" in every score-group row (they are components of the same score). Text value `n/a` so identical-row detection still works. Row emphasis already ignores ineligible products (`bestIn`, `statusOf`). |
| Price rows in the matrix | "Not available for 10" | unchanged; `bestIn` already excludes it from "Lowest" |
| Verdict | already excludes it from the winner and explains why | kicker fix: "the highest Prodcom score of your **3 that can serve a team of 10**" when any pick is excluded (today it counts excluded picks: "of your 4") |
| Winner | can never be ineligible (`verdictFor` ranks eligible only) | unchanged; covered by an explicit test |
| One-pick state, ineligible pick | "Quillo scores 38 for a team of 10. These are the closest to it on score" | "Quillo can't serve a team of 10 (supports at most 5 seats). Add at least one more to compare. Top picks for 10:" with the top three eligible by `compareScored`. "Nearest on score" is meaningless without a score. |
| Empty state, "Try the top three" | top three eligible | shown only when at least two products are eligible |

**All picks ineligible** (impossible with today's data, since only Quillo has a cap and one pick never yields a verdict; defined for safety): the verdict shows the existing "None of these products can serve a team of N" plus the exclusion note. No winner, and every pick keeps a quiet Visit.

**All products ineligible** (impossible: `TEAM_MAX` is 500 and only one product is capped): every row shows "Not scored", ordered by steps 2–4; "Try the top three" is hidden.

**Team size changes while products are selected:** picks are never removed. The verdict, the matrix and the table recompute on the new size. When a selected product's eligibility flips, the existing live announcement ("Prices and scores updated for a team of N.") gains one sentence: "Quillo can't serve N and is left out of the verdict." or "Quillo can serve N again and is back in the verdict." The trade-off list and the exclusion note update as today.

**Analytics:** `product_cta_clicked` gains `eligible` (see 3.2). No new event.

**Accessibility:** "Not scored" is text, not colour. The reason is in the accessible name. The quiet Visit keeps the existing ≥4.5:1 contrast and focus ring. The score cell currently has `white-space: nowrap` (score-wrap hotfix): "Not scored" uses its own class so it can wrap inside the 7.5% column at 1040–1179 px. Regression-tested below.

**C→D→A:** removes a number that reads as a bad grade but means "not applicable" (COMPARE); an unservable product can never look like a recommendation (DECIDE); its exit stays available but is demoted and explained, so clicks on it are informed rather than accidental (ADVANCE, qualified). Removing its Visit altogether is **not** proposed: a five-seat tool can still fit a sub-team, and there is no evidence either way.

### 1.3 Related categories (C1-A, non-commercial)

Replace each `<a href="/compare/<slug>/">` with non-interactive text in the same list: name and note unchanged, plus a muted "Coming soon". Section sub-copy changes from "Not quite the right kind of tool? Compare the neighbours." (an invitation to act) to "Neighbouring categories we plan to compare. Not available yet." Heading and position stay (U-4). No placeholder pages, no new URLs. Hover and focus styles for the links are removed with them, so nothing looks clickable.

**C→D→A:** a user who decides the category is wrong is no longer sent to a 404 (COMPARE: honest scope of the comparison). No commercial effect.

---

## 2. C1-B mobile CTA specification

**Today (verified):** below 960 px the head-to-head renders attribute stacks (`Stacks` in `HeadToHead.tsx`) instead of the matrix. Its only Visit is the winner's, in the verdict. The desktop matrix has a Visit per pick in an actions row (winner solid, others quiet, placement `matrix`). The stack key ("Your picks") is `position: sticky`, so putting CTAs in it would add a permanent sticky CTA footprint. That is rejected.

**Smallest viable approach:** one non-sticky actions list, rendered once at the top of `Stacks`, directly before the sticky key:

```
Your picks
 1  Northlane   ★ Best overall   [Visit ↗]   (solid)
 2  Mondray                      [Visit ↗]   (quiet)
 3  Taskara                      [Visit ↗]   (quiet)
 4  Quillo      Can't serve 10   [Visit ↗]   (quiet)
```

| Requirement | How |
|---|---|
| Each CTA identifies its product | Product name visible on the same row; accessible name "Visit Mondray (opens in a new tab)" from the existing `Visit` component |
| Recommended vs alternative | Winner row keeps the existing Best label (glyph + text, not colour alone) and the solid variant, mirroring the desktop matrix; others quiet; ineligible rows show "Can't serve N" |
| UTM preserved | Same `visitUrl`; new placement value **`stack`** → `utm_content=stack`, so phone head-to-head clicks are distinguishable from desktop `matrix` clicks. Existing values unchanged |
| Disclosure and link security | Same component: `target="_blank"`, `rel="sponsored noopener"`, `data-visit`; masthead and Method disclosure unchanged |
| No duplicate events | One `onClick` per link. Matrix and stacks are mutually exclusive by CSS at 960 px, so only one is clickable; the existing 800 ms dedupe covers double taps |
| No sticky footprint | The list scrolls away; the sticky key is unchanged |
| Keyboard and touch | Links in DOM order after the view controls and section index; Visit keeps its ≥44 px target; rows wrap at 320 px (name above, actions below) |

**Not proposed:** a second list at the end of the stacks, Visit inside every row group, or a sticky bar. Repetition would be added only if `stack` data later shows users reach the end and leave without acting.

**C→D→A:** a phone user persuaded by "Choose Mondray if…" can act on that decision in place instead of scrolling 5,000–10,000 px back to the table (ADVANCE), with the recommendation still visibly distinguished (DECIDE).

---

## 3. C0-A event and attribution contract (schema v2)

### 3.1 `comparison_started`

**Why the current trigger fails.** An `IntersectionObserver` with `threshold: 0.15` fires when 15% of `#compare` is visible. The visible fraction can never exceed `viewport height ÷ section height`, so any section taller than 6.67 viewports never fires: 375×812 with 4 picks (max 0.079), 768×1024 with 4 (0.107), 375×667 with 2 (0.129). It also measures visibility, not entry. Separately, the tray click and the observer keep separate memories, so on desktop one comparison is counted twice.

**Contract:**
- **Meaning:** the user entered the head-to-head for a given set of 2–4 picks.
- **Once per distinct set per page view.** The set key is the sorted ids. Re-entering the same set does not fire again; changing the set and entering again does. One shared registry in `track.ts` (`startComparison(setKey, trigger)`) serves the tray and the observer. Whichever trigger comes first wins; the other is suppressed.
- **Triggers:**
  - `tray`: "Compare N" pressed. "See alternatives" with one pick jumps to the same section but does not fire: one pick is not a comparison.
  - `scroll`: the head-to-head **heading** (`#compare-title`, a small fixed-height element) crosses into the upper half of the viewport (`IntersectionObserver` on the heading, `threshold: 0`, `rootMargin: '0px 0px -50% 0px'`). It does not depend on the section's height.
  - `link`: the page loads with `#compare` in the URL and 2+ picks (a shared or bookmarked comparison). Only after hydration, and only if the heading is actually in view.
- **Does not fire** on render alone: a page loaded with `?compare=` but no hash, with the head-to-head below the fold, fires nothing until the user scrolls or presses Compare.
- **Entry vs visibility:** `comparison_started` is entry. No separate visibility or dwell event is proposed; depth is already measured by `comparison_view_changed`, and a dwell event would answer no current decision.
- **Direct vs comparison-assisted journeys:** unchanged events let both be built. A direct exit is a `product_cta_clicked` with `placement ∈ {ledger, ledger-card}` and no prior `comparison_started` in the page view. An assisted exit has one.

### 3.2 `product_cta_clicked` and `product_selected`: new context

Existing payload (verified): `product_id`, `placement`, `destination_host` + envelope `team_size`, `selected_ids`, `selected_count`, `winner_id`, `comparison_view`, `page_view_id`, `ts`, `schema_version`.

| Field | On | Type | Meaning |
|---|---|---|---|
| `table_sort` | **envelope** (every event) | `score` \| `price` \| `rating` \| `features` \| `name` | active table sort when the event fired |
| `display_position` | `product_cta_clicked`, `product_selected` | int 1–10 \| null | position in the table **as displayed** (current sort); null outside the table (`verdict`, `matrix`, `stack`, suggestions) |
| `rank_position` | `product_cta_clicked`, `product_selected` | int 1–N \| null | position in the **recommendation order** (`compareScored`, eligible products only) for the current team; null when ineligible |
| `eligible` | `product_cta_clicked` | boolean | product can serve `team_size` |
| `placement` | `product_cta_clicked` | adds `stack` | phone/tablet head-to-head list |

Already present and kept: surface (`placement`), team size, comparison context (`selected_ids`, `winner_id`, `comparison_view`). "Is the winner" = `winner_id === product_id`; "in the comparison" = `product_id ∈ selected_ids`. Both are derivable, so no fields are added for them.

`display_position` ≠ `rank_position` whenever the user sorts by anything but score, or ties exist. That difference is what separates position bias from recommendation pull.

**Not added:** click id (useless until a network sub-id exists, P2), any user or session identifier, any personal data. **Nothing new goes into the outbound URL:** position and rank are internal analytics, not vendor-facing UTMs.

**Versioning:** `SCHEMA_VERSION` 1 → **2**. The new fields are additive, but the `comparison_started` semantics change (counts rise on phones and fall on desktop), so v1 and v2 counts must not be trended together. `tracking-plan.md` is updated in the same change, as its own rule requires.

**C→D→A:** reliable entry counts show whether comparison precedes exits (DECIDE → ADVANCE); position versus rank shows whether clicks follow the recommendation or the screen order (ADVANCE quality); `eligible` isolates clearly unqualified exits.

---

## 4. C0-B analytics and consent proposal (no installation): OUT OF SCOPE

> Closed 2026-10-10 (U-6). Nothing in this section will be implemented: no provider, tag manager or consent platform. It stays as a record of how collection would be designed for a real product.

### Current state (verified)
- **Consent:** none. No consent platform, no banner, no cookies, no storage (`document.cookie` and `localStorage` empty in production).
- **Analytics:** `track()` pushes to `window.dataLayer` only. No tag manager, SDK or endpoint. The only third-party script in production is Netlify's HUD (`/.netlify/scripts/hud`, the free-plan badge).
- **Available integrations:** none installed. The vendor-neutral `dataLayer` contract is directly readable by GTM and by any small forwarder.
- **Missing infrastructure:** consent management, a collection provider, a staging property, a warehouse, a conversion import, an experiment assignment platform, and business metric definitions.

### Provider options

| Option | Fit for Prodcom | Trade-offs |
|---|---|---|
| **A. CMP + GTM + GA4 (Consent Mode v2)** | Reads `dataLayer` natively; free; familiar to affiliate partners | Consent banner needed for EU traffic; GA4 thresholds and sampling; event-parameter limits (fits v2); data in Google; no experiments |
| **B. Cookieless analytics (Plausible, Fathom, self-hosted Umami)** | Light; custom events with properties | Whether consent can be skipped depends on jurisdiction and configuration and needs legal sign-off; weak funnels; no visitor-level joins; no experiments |
| **C. Product analytics (PostHog EU cloud or self-hosted)** | Funnels, cohorts, **feature flags and experiments** (covers P5), warehouse export | Heavier script; cost at scale; consent needed for any persistence; configuration effort |
| **D. First-party endpoint (Netlify Function → warehouse)** | Full control; joins cleanly with affiliate postbacks | You build and maintain collection, bot filtering and dashboards |

**Recommendation (historical, superseded by U-6 on 2026-10-10; not to be implemented):** **C (PostHog, EU region), consent-gated, memory-only persistence until consent**, with warehouse export when revenue import (P3) arrives. It is the only option that also provides the experiment platform the backlog needs (P5) without a second vendor. **A** is the fallback if partners or the organisation already standardise on Google. The decision is the business's; it needs cost and legal review (G3).

### Transport and consent gating
- `track()` stays the single producer; components never call a vendor.
- One forwarder module subscribes to `dataLayer` and sends nothing until consent is `granted` for analytics.
- **Before consent:** events stay in memory for the current page view only. On grant, that page view's buffer is flushed. On deny, or when the page unloads, it is discarded. Nothing is written to storage before consent.
- **After consent:** the provider may persist an anonymous id only if the consent text covers it; otherwise memory persistence, with `page_view_id` as the only join key.
- Region-aware banner: whether non-EU traffic gets a different default is a legal decision, not an engineering default.

### Validation strategy
1. Staging property on Netlify deploy previews, never the production property.
2. Playwright: **no request to the provider host before consent**; after consent, one request per event, with payloads equal to the `dataLayer` entries (intercepted, not sent).
3. Provider debug view: walk the E2E journey and match event names and fields.
4. Reconciliation after launch: provider `comparison_page_viewed` vs Netlify request logs within an agreed tolerance (bots and denials explain the gap); `product_cta_clicked` vs outbound clicks at the network once real links exist.
5. The funnel is declared measurable only after steps 1–4 pass in production. Until then this spec claims nothing about measurability.

### Business definitions required (P4)
- **CVR:** numerator (attributed approved conversions? outbound clicks?), denominator (eligible page views or sessions), attribution window.
- **VCVR:** the organisation's own definition.
- **Gross Profit:** confirm or replace the repo's proposal (approved attributed revenue − network fees − attributable acquisition cost); currency, refund and reversal handling.

### Downstream attribution and revenue reconciliation (P2, P3)
- Per network: the sub-id parameter name (verify, never guess). Generate `click_id` (UUID) at click, add it to `product_cta_clicked` and to the outbound URL in that parameter.
- Server import of postbacks or reports as `attributed_conversion` (spec in `tracking-plan.md`), keyed by `click_id`, with `pending`, `approved` and `reversed` states.
- Gross Profit computed only in the warehouse; never exposed client-side.

**C→D→A:** this is the precondition for knowing whether any change helps users advance profitably; until it exists, ADVANCE is unmeasured.

---

## 5. Files likely to change (C0 + C1)

| File | Change |
|---|---|
| `src/lib/score.ts` | `compareScored`: eligibility first, score only between eligible, `localeCompare(…, 'en')`; export a `rankPosition` helper |
| `src/components/Ledger.tsx` | Score sort = `compareScored`; other sorts fall back to it; "Not scored" cell and card; quiet contextual Visit for ineligible; pass `display_position` and `rank_position`; publish `table_sort` to the track context |
| `src/components/Visit.tsx` | optional `displayPosition`, `rankPosition`, `eligible` props → event; placement `stack` |
| `src/lib/track.ts` | v2 types and fields; `table_sort` in the envelope; `startComparison(setKey, trigger)` registry |
| `src/components/Tray.tsx` | `jumpToCompare` uses the shared registry |
| `src/components/HeadToHead.tsx` | heading-based observer, `link` trigger; non-sticky stack actions list; header "Not scored"; one-pick copy for an ineligible pick; guard on "Try the top three" |
| `src/components/rows.tsx` | score-group rows render "Not scored" / `n/a` for ineligible picks |
| `src/components/Verdict.tsx` | kicker counts only eligible picks when any are excluded |
| `src/components/Related.tsx` | text instead of links; sub-copy |
| `src/App.tsx` | eligibility-flip sentence in the team-size announcement; `product_selected` carries the positions |
| `src/styles.css` | not-scored cell (wrapping); stack actions list; related items without link styles |
| `src/lib/logic.test.ts`, `tests/compare.spec.ts`, new `tests/tracking.spec.ts` | tests below |
| `docs/analytics/tracking-plan.md` | contract v2 |
| `.design/context.md` | D-8 (placement `stack`), D-9 (ineligible row hierarchy), iteration note |

No change to `src/data/products.ts`, weights, prices, URLs or UTM parameters beyond the added `stack` value.

---

## 6. Regression test plan

**Unit (`node --test`)**
- Tie on score broken by rating: team 10, Orbitask before Taskara; team 100, Fernwork before Taskara.
- Tie on score and rating broken by price, then by name: synthetic `Scored` copies with overridden rating and price.
- Eligibility first: for every team size 1–500, all eligible products precede all ineligible ones, and the order equals the table's Score order.
- An ineligible product is never the winner, whatever its score.
- Team size crossing a cap (5 → 6): Quillo becomes ineligible, moves last, and gets `rank_position` null.
- v2 payload: `table_sort`, `display_position`, `rank_position`, `eligible`; `schema_version` 2; no `@` anywhere.
- `startComparison`: same set twice → one event; different set → a new event; tray then scroll → one event.

**E2E (`tests/tracking.spec.ts`)** at **375×667, 375×812, 768×1024** (plus 1440×900 as control), each with **2 and 4 picks**:
- Load `?compare=…` without a hash: zero `comparison_started` after load and settle.
- Scroll until the heading reaches the upper half: exactly one `scroll`. Scroll away and back: still one.
- From the table, press "Compare N": exactly one `tray`, zero `scroll` for that set.
- Change the set and re-enter: a second event, with the new `selected_ids`.
- Load with `#compare`: exactly one `link`.

**E2E (`tests/compare.spec.ts` additions)**
- The table's Score order at team 10 matches the verdict on the tied pair.
- Team 10: Quillo shows "Not scored", sits last under Score, has a quiet Visit whose accessible name includes the seat limit, and its checkbox works. Team 3: Quillo shows a number again.
- Phone 375 with 4 picks including the winner: the stack actions list has 4 Visits, the winner's solid; `href` has `utm_content=stack`; `rel` and `target` intact; one click → one `product_cta_clicked` with `placement: 'stack'`; the list is not sticky; no horizontal overflow at 320.
- Related: no links inside `.related`; each item says "Coming soon".
- Existing analytics journey test updated for v2 fields; every existing assertion stays.

**Unchanged suites that must stay green:** responsive spec (scores on one line, feature bars, tray clearance, 320–1440 overflow), tray-hit spec, keyboard and 400% zoom tests, axe scan (0 violations).

**Production verification after deploy:** the same `tracking.spec.ts` against production (`PLAYWRIGHT_BASE_URL`, read-only, outbound intercepted).

---

## 7. Dependencies and risks

| Risk | Mitigation |
|---|---|
| "Not scored" breaks the score column at 1040–1179 px (nowrap hotfix) | own class that wraps; covered by the responsive spec at 9 widths |
| Quiet Visit on ineligible rows lowers clicks on that product | intended: fewer unqualified exits; visible in `eligible` once measured; reversible in one line |
| Phone list increases total CTA count | one list, non-sticky, no copy beyond "Visit"; observable via `placement: stack` |
| v2 breaks trends | no production collection exists yet, so there is no v1 history to break; versioning documents it anyway |
| Heading observer misses very fast jumps | the tray path fires independently; the test covers both |
| `link` trigger fires for bots | collection is consent-gated; bots are filtered at the provider |
| Business rejects the published tie rule | the comparator and Method copy are changed together; tests encode whichever rule is approved |
| Consent and provider choice delayed | C0 and C1 still ship correctness value; nothing claims measurability until production collection is verified |

Dependencies: C1-A and C0-A are code-only. C0-B, which needed a business owner (provider, legal, budget) and P2–P4 for revenue, is out of scope (U-6).

---

## 8. Implementation sequence and approval gates

| Step | Content | Gate |
|---|---|---|
| G1 | Approve this spec's contracts: **tie-break order (1.1)**, **eligibility behaviour incl. quiet Visit (1.2)**, **related as text (1.3)**, **phone actions list with placement `stack` (2)**, **event contract v2 (3)** | your approval; G1 covers code changes only, not commit or deploy |
| 1 | C1-A ranking + eligibility + related, with unit and E2E tests | — |
| 2 | C0-A tracking v2 (registry, heading observer, new fields), with `tracking.spec.ts` | — |
| 3 | C1-B phone actions list, with tests at 320/375/768 | — |
| 4 | Full suite, axe, responsive sweep, diff review, design-context and tracking-plan updates | — |
| G2 | Review of the diff and test evidence | your approval to commit, push and deploy |
| 5 | Deploy, then production verification (tracking spec, responsive spec, commercial contract checks) | — |
| ~~G3~~ | Provider choice, consent design and legal review (C0-B) | **out of scope** (U-6) |
| ~~G4~~ | CVR, VCVR and GP definitions; network sub-ids; conversion import | **out of scope** (U-6); the metrics stay conceptual |

Out of scope throughout: filters, weight changes, new sections, urgency elements, visual changes beyond the states above, installing any analytics.

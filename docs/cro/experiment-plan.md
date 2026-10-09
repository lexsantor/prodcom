# Prodcom CRO, VCVR and Gross Profit plan

Date: 2026-10-09. Scope: the comparison page as it stands after the iteration-3 UX refactor. Tracking contract: `docs/analytics/tracking-plan.md`.

## 1. Verdict on readiness

**No experiment can be run or evaluated yet, and Gross Profit cannot be calculated.** Phase-0 discovery of the repository found:

| Requirement | Status in repo | Consequence |
|---|---|---|
| Analytics / conversion events | none before this run; now `dataLayer` events (contract v1) | events exist but go nowhere until a tag manager is installed |
| CVR definition | not documented anywhere | primary metrics are named, not yet defined (open question 1) |
| VCVR definition | not documented; the organisation's internal definition is required | not guessed |
| Attribution model | UTM on outbound links only; no click id, no postback | clicks cannot be joined to vendor conversions |
| Monetization model / commercial agreements | none; destinations are fictional `*.example` hosts | revenue per click is unknown; destination types (trial, pricing, demo) are unverified |
| Revenue, cost, margin data | none | **Gross Profit cannot be calculated reliably.** CTR is not used as a substitute |
| Traffic segmentation | only what events carry (device must come from the tag manager; source from UTM/referrer) | no historical baseline |
| Experiment infrastructure | none (no flags, no assignment) | specs below are implementation-ready, not implemented |
| Consent / privacy | no consent platform | EU traffic cannot be measured lawfully until one gates the tags |
| Environment | **demo**: every product, price and rating is fictional and disclosed as such | no commercial change is justified on this data |

Per the brief's stop rule, this run delivered instrumentation and specifications only. It made no speculative commercial change.

## 2. Commercial funnel audit

There are no metrics, so each stage lists what is now measurable and the friction observed in the 2026-10-09 UX audit (two independent reviewers, Chromium). These observations are qualitative, not drop-off rates.

| Stage | Event (contract v1) | Observed friction (qualitative) | Measurable now? |
|---|---|---|---|
| Page view | `comparison_page_viewed` | Phone masthead pushes the first product below the fold (gen-1 critique) | yes |
| First meaningful interaction | first `product_selected` / `team_size_changed` / `product_cta_clicked` | Team size sits in the table header, not the hero | yes (derived) |
| Product selection | `product_selected` | Checkbox is a small 20 px box in a 44 px target | yes |
| Two-product activation | 2nd `product_selected` in a `page_view_id` | One pick shows suggestions only inside the head-to-head, not in the tray | yes |
| Comparison activation | `comparison_started` (tray / scroll) | — | yes |
| Comparison engagement | `comparison_view_changed`, `comparison_shared` | Key differences became the default (hypothesis, E2) | yes |
| Commercial CTA | `product_cta_clicked` by `placement` | Ledger Visit stripe dominates selection (both visual reviewers); **on phones the head-to-head offers Visit only for the winner** (verdict), none for the other picks | yes |
| Qualified outbound visit | — | Undefined: needs a VCVR definition and vendor-side landing data | no |
| Attributed conversion | `attributed_conversion` (server) | No click id, no postback | no |
| Gross Profit | warehouse | No revenue or cost data | no |

Segments available once a tag manager exists: device (tag manager), traffic source (UTM/referrer), new vs returning (only with consented storage), `team_size`, `selected_ids`, comparison depth (`comparison_view`, view changes), provider (`product_id`), CTA placement (`placement`). Commercial destination type: unavailable until destinations are real and classified.

## 3. Opportunity register

| # | Opportunity | Mechanism | Evidence type |
|---|---|---|---|
| O1 | Ledger Visit prominence competes with selection | attention allocation: comparing first may produce better-qualified clicks | observed (2 independent reviewers) |
| O2 | No Visit for non-winner picks in the phone head-to-head | missing action at the decision moment | observed in code (`Stacks` renders no CTA) |
| O3 | Head-to-head default view (key vs complete) | decision effort versus completeness | heuristic + measured head-to-head length (−28% at 768 and 375 px, 3 picks) |
| O4 | One-pick dead end in the tray | two-product activation | heuristic |
| O5 | Team size not in the hero | relevance of prices from first view | heuristic |
| O6 | Destination-specific CTA labels ("Start free trial", ...) | expectation match → qualified visits | **blocked**: destination types unverified |
| O7 | Affiliate disclosure next to monetized links | trust; legal requirement once links are monetized | done (masthead + method); requirement, not an experiment |
| O8 | Email list capture | re-engagement | needs an ESP and consented storage; value is incremental GP, not submissions |

## 4. Prioritization framework

Each criterion 0–3, defined in advance; total out of 15. **Evidence never scores 3** here, because 3 requires measured data and none exists. No confidence percentages are assigned.

- **Impact path** — 3: changes the outbound decision moment; 2: changes activation or comparison; 1: upper funnel or retention.
- **Evidence** — 0: none; 1: heuristic or practice; 2: observed in our audit or code; 3: measured on Prodcom traffic.
- **Effort** (inverse) — 3: copy/CSS behind a flag; 2: component change; 1: new data or infrastructure.
- **Measurability** — 3: primary metric fully measurable with planned data; 2: measurable on events but GP needs the revenue join; 1: needs new data sources.
- **Risk** (inverse) — 3: no trust, accessibility or suitability risk; 2: manageable; 1: material.

| Rank | Experiment | Impact | Evidence | Effort | Measurability | Risk | Total | Dependency |
|---|---|---|---|---|---|---|---|---|
| 1 | E1 Ledger Visit: solid vs outline | 3 | 2 | 3 | 2 | 3 | **13** | P1–P5 |
| 2 | E3 Phone head-to-head: per-pick Visit | 3 | 2 | 2 | 2 | 2 | **11** | P1–P5 |
| 3 | E2 Head-to-head default view | 2 | 1 | 3 | 2 | 2 | **10** | P1, P3–P5 |
| 3 | E4 Tray suggestions after one pick | 2 | 1 | 2 | 3 | 2 | **10** | P1, P3–P5 |
| 5 | E5 Team size in the hero | 1 | 1 | 2 | 3 | 3 | **10** | P1, P3–P5 |
| — | E6 Destination-specific labels | — | — | — | — | — | blocked | real destinations classified |

Prerequisites, in order (none optional):
- **P1** consent platform + tag manager reading `dataLayer`
- **P2** real commercial destinations with verified agreements, and a per-click `click_id` in each network's sub-id parameter
- **P3** postback or report import into a warehouse, with revenue status and refunds
- **P4** written CVR and VCVR definitions
- **P5** experiment platform or feature flag with sticky assignment and exposure logging

## 5. Experiment specifications

Common to all: unit = visitor (sticky assignment); α = 0.05 two-sided; power 0.80; fixed horizon, no peeking. Use a sequential test only if the platform implements it correctly. Minimum 2 full weeks to cover weekday cycles. Conversion metrics are read only after the network's attribution window has closed (verify per network). Decide on the **primary metric only**; secondaries explain, guardrails can veto.

**Primary metric, all experiments:** Gross Profit per eligible visitor = (approved attributed revenue − direct costs) / eligible visitors. It is a continuous, heavy-tailed metric, so use a t-test on visitor-level values with winsorization at the 99.9th percentile (pre-registered) or a bootstrap CI. Until P3 exists it cannot be evaluated, and **CTR must not stand in for it**.

**Sample size:** there is no baseline, so here is a lookup for the binary secondaries (visitors per arm, two-proportion test, α .05, power .80). Read it once a 2-week baseline exists.

| Baseline rate | +5% relative | +10% relative | +20% relative |
|---|---|---|---|
| 1% | 637,007 | 163,092 | 42,690 |
| 2% | 315,203 | 80,679 | 21,106 |
| 5% | 122,121 | 31,231 | 8,155 |
| 10% | 57,760 | 14,748 | 3,838 |
| 20% | 25,579 | 6,507 | 1,680 |

GP per visitor needs a variance estimate from the baseline period: n per arm ≈ 2·(1.96 + 0.84)²·σ²/MDE². Duration = n per arm × arms ÷ daily eligible visitors. If it exceeds 8 weeks, raise the MDE or do not run.

### E1 — Ledger Visit prominence (rank 1)

- **User problem:** in the ten-product table, ten solid ink Visit buttons draw the eye before the checkboxes, so users may leave before comparing.
- **Hypothesis:** an outline Visit in the table (solid kept in the verdict and for the matrix winner) shifts early, unqualified exits into comparisons, so clicks that do happen are better matched and GP per visitor does not fall. The opposite is plausible: fewer impulse clicks, lower GP. That is why this is a test, not a ship.
- **Evidence:** two independent visual reviews (2026-10-09); no traffic data.
- **Control:** current solid ink Visit in ledger rows and cards. **Treatment:** `visit-quiet` variant in placements `ledger` and `ledger-card` only. One variable: visual weight. Copy, position, URL and tracking stay identical.
- **Primary:** GP per eligible visitor. **Secondary:** CVR and VCVR (as defined in P4), `product_cta_clicked` per visitor by placement, comparison activation rate, share of CTA clicks from inside the head-to-head.
- **Guardrails** (veto if significantly worse): attributed conversion rate per click, error rate, accessibility checks (contrast and focus of the quiet variant, already ≥ 4.5:1), and click distribution across providers (no provider loses more than its traffic share explains).
- **Audience:** all eligible visitors; desktop and mobile analysed as pre-registered segments, not post-hoc.
- **Rollback:** disable the flag. Automatic if the error rate rises or attributed conversion per click drops beyond the pre-set guardrail bound.

### E3 — Per-pick Visit in the phone head-to-head (rank 2)

- **User problem:** on phones the head-to-head offers a Visit only for the winner; a user persuaded by a "Choose X if" trade-off must scroll back to the table.
- **Hypothesis:** an action at the point of decision increases qualified visits for non-winner picks without reducing the winner's.
- **Control:** current. **Treatment:** a quiet Visit per pick in the phone stack key, placement `matrix-phone` (a new placement value, added to the contract with the experiment). One variable: CTA availability.
- **Primary:** GP per eligible mobile visitor. **Secondary:** CTA clicks per comparison, provider mix of clicks. **Guardrails:** winner click share must not shift from relevance to position alone (compare against the verdict's recommendation); tap-target and overlap checks at 320 px.

### E2 — Head-to-head default view (rank 3)

- **Control:** Complete matrix default. **Treatment:** Key differences default (shipped in iteration 3 as a hypothesis; the experiment needs both arms behind a flag). One variable: default view.
- **Primary:** GP per visitor who reaches the comparison. **Secondary:** `comparison_view_changed` to `all`, CTA after comparison. **Guardrail:** attributed conversion per click (decision quality).

### E4 — Tray suggestions after one pick; E5 — team size in the hero

Specify when ranks 1–3 are resolved. E4 suggestions must use the editorial score and similarity only (as `nearestBy` does today), never commission.

## 6. Editorial integrity rules (guardrails for every experiment)

- `src/lib/score.ts` takes only product attributes and team size. Commercial data (commission, margin, sponsorship) must never become an input to the score, ranking, default sort, verdict or suggestions. Any sponsored placement must be a separate, labelled surface.
- Limitations stay visible in the table ("Watch out"), in Details and in the matrix. No experiment may hide them.
- No fabricated scarcity, urgency, testimonials, promotions or trial terms; trial labels only when the destination is verified to be a trial.
- Every Visit link carries `rel="sponsored"`, and the page discloses affiliate links in the masthead and in "How the score works" (stating that commission is not a score input). Keep both in place in every variant of every experiment.

## 7. Risk and guardrail summary

| Risk | Mitigation |
|---|---|
| Optimizing CTR instead of GP | primary metric is GP per visitor; CTR is secondary only |
| Commission biasing the verdict | rule §6; score inputs reviewable in `score.ts` |
| Underpowered tests | sample-size gate before launch; no early winner calls |
| Attribution delay | read conversions after the window closes; report pending vs approved |
| Consent non-compliance | P1 before any production measurement |
| Event drift | `SCHEMA_VERSION`, unit and E2E tracking tests in CI |

## 8. Recommendation

**Do not ship, iterate or revert anything commercial yet. There are no results.** Ship the instrumentation (contract v1). Close P1–P5, collect at least 2 weeks of baseline, then launch E1 behind a flag.

## Open questions

1. What are the organisation's exact definitions of CVR and VCVR: numerator, denominator, attribution window?
2. Which affiliate networks or direct agreements apply per vendor, and what is each network's sub-id parameter?
3. Which destination does each vendor link go to (trial, pricing, demo, home)?
4. Which consent platform and tag manager will read `dataLayer`?

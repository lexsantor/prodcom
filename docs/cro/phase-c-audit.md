# Prodcom V3: product and conversion audit (pre-Phase C)

Date: 2026-10-10. Read-only audit. Nothing in `src/`, tracking, scoring, pricing or links was changed.

> **Scope (2026-10-10, U-6):** Prodcom is a fictional side project and product-design portfolio demonstration, not a live business. CVR, VCVR and Gross Profit are conceptual business metrics; nothing in this document is a measured outcome. Analytics providers (PostHog, GA4, GTM or any other), consent management platforms, revenue attribution, affiliate postbacks and live commercial A/B testing are **out of scope**. Sections that depend on them are kept as design reasoning, not as a plan.
> **Outcome:** C0-A, C1-A and C1-B shipped in 46854fd and are closed; C0-B and C3 are out of scope; C2 ideas moved to the product-experience backlog (see `.design/context.md`, iteration 6).
Builds on `docs/cro/experiment-plan.md` (2026-10-09) and `docs/analytics/tracking-plan.md` (contract v1); it does not repeat them where they still hold.

**Environment checked:** `main` = `origin/main` = `750733e`, clean tree. A fresh local build produces `index-BBlLbfY4.js` and `index-BghTXoun.css`, the exact assets production serves, so production is the current `main`.
**Evidence sources:** repository code and docs; Playwright (Chromium) against https://prodcom-v1.netlify.app at 1440×900, 768×1024, 375×812 and 375×667 (outbound `*.example` requests intercepted and aborted, so no commercial request left the browser); a scoring sweep over team sizes 1–500 using `src/lib/score.ts` itself. Scripts and screenshots are in the session scratchpad, not the repo.
**Not available:** any analytics vendor, traffic, revenue or partner data. No user research. Every claim about user behaviour below is labelled as a hypothesis.

---

## 1. Executive verdict

**Compare: largely yes.** One table with price for the user's team size, coverage, rating, a strength and a limitation per row; a head-to-head limited to the user's picks, with a key-differences default and a counted complete view. This is materially easier than evaluating ten vendor sites. Verified weak points: on a phone the first viewport shows no product (first row at 854 px of 812), and a four-pick head-to-head is 10,265 px long on a phone.

**Decide: partly.** The verdict explains itself ("ties on 68, ranks first on rating"), lists where each other pick is stronger and links each reason to its evidence rows. But three verified conditions undercut confidence:
- the table orders equal scores differently from the verdict and from the tie rule the page publishes (F1);
- a product that cannot serve the team still shows a score (38/100) and a solid Visit (F4);
- the winning margin is often 1–2 points on fixed editorial weights, presented with the same certainty as a 15-point margin (F8, hypothesis about user impact).
Team size is the only personalization, and the ranking swings strongly with it (three different winners between 1 and 100 people), while the default of 10 is applied silently.

**Advance: the path exists, its value cannot be known.** Visit links are present in the table, the verdict and the desktop matrix, disclosed as affiliate links, `rel="sponsored"`, with placement UTMs. On phones the head-to-head offers Visit for the winner only (F5). The decisive fact: **production measures nothing today.** The only scripts on the page are the app bundle and Netlify's HUD; `dataLayer` events never leave the browser. CVR and VCVR are **UNDEFINED**; Gross Profit has a repo-proposed formula but is **NOT MEASURABLE** (fictional `.example` destinations, no click id, no revenue). Even outbound CTR is not collected.

**Does Prodcom fulfil "make comparison easier and help users progress toward a commercially profitable decision"?**
- Comparison easier: verified, with mobile-length friction.
- Confident decision: partially, with three fixable trust defects.
- Commercially profitable progression: **cannot be assessed.** Not because the funnel is broken, but because there is no measurement, no definition and no revenue path. One verified tracking defect (F2) would also bias the funnel by device once measurement exists.

---

## 2. Product journey map

Two journeys are both legitimate: **direct exit** (table → Visit) and **comparison-assisted** (table → pick 2–4 → head-to-head → Visit).

| Stage | User goal / question | What the page offers (verified) | Likely friction | Observable signal (contract v1) | Missing evidence | Commercial relevance |
|---|---|---|---|---|---|---|
| Landing | "Is this the right kind of page?" | H1 names category and promise; demo and affiliate disclosure; 3 steps | Phone: hero + ledger head fill 812 px; no product visible (F6) | `comparison_page_viewed` (`from_shared_link`) | traffic source, device (needs a tag manager) | sets trust |
| Orientation | "Are these prices for me?" | Team size stepper beside the table head (desktop y=510, phone y=706); default 10 | Default applied silently; ranking depends heavily on it (F9) | `team_size_changed` (from/to) | share of visitors who never adjust | relevance of every later click |
| Evaluation | "Which few are worth a look?" | Sort by column; score, price arithmetic, rating, coverage, one strength and one limitation; Details | Equal scores ordered against the published rule (F1); unservable product scored 38 (F4) | none for sort or Details | sort used; Details opened | which products get exposure |
| Shortlisting | "Which 2–4 should I compare?" | Checkbox + tray, replace-when-full, 1-pick suggestions, "Try the top three" | 1 pick: tray says "Tick one more", suggestions only inside the head-to-head | `product_selected`/`_deselected` (`source`), `comparison_full_blocked` | — | — |
| Comparison | "How do they really differ?" | Verdict, trade-offs with evidence links, 3 views with row counts, section index, copy link | Phone length 5,179 px (2 picks) to 10,265 px (4 picks, key view) (F7) | `comparison_started` (tray/scroll), `comparison_view_changed`, `comparison_shared` | **scroll start cannot fire on most phones/tablets (F2)** | where confidence is built |
| Decision | "Why this one, and what do I give up?" | "Best overall… N points ahead"; "Choose X if…" per other pick; "See where X is behind" | Small margins read as decisive (F8); no must-have constraints (F10) | `winner_id`, `comparison_view` in envelope | comprehension of the verdict (research only) | qualified vs impulsive exit |
| Commercial exit | "What happens if I click?" | "Visit" + external icon, new tab; trial/free badge near the verdict CTA | Phone head-to-head: no Visit for non-winners (F5); label promises no destination (F14) | `product_cta_clicked` (`placement`, `destination_host`) | list position and sort at click (F13); click id | the only commercial event |
| Downstream | trial/purchase at vendor | none (fictional hosts) | — | none | `attributed_conversion` specified, not built | revenue, Gross Profit |
| Exit without deciding | "Not the right category" | Related categories | **all 6 links return 404 (F3)** | none | — | lost session |

Return paths verified: browser Back after "Compare N" returns to the table; reload with `?compare=…&team=…&view=…` restores picks, team and view. No storage is used, so a returning visitor without the link starts empty (by design).

---

## 3. Decision friction register (ranked)

Ranked by effect on a confident choice, then evidence strength.

| Rank | ID | Class | Finding | Evidence | Dimension |
|---|---|---|---|---|---|
| 1 | F1 | VERIFIED DEFECT | Table "Score" sort ignores the tie rule the Method section publishes ("equal scores are decided by user rating, then lower price, then name"). Team 10: table shows Taskara 68 above Orbitask 68; selecting both, the verdict names Orbitask on rating (4.8 vs 4.2). Team 100: Taskara 68 above Fernwork 68 (Fernwork rated higher). | `Ledger.tsx` `SORTS.score.cmp` compares `overall` only; `score.ts` `compareScored` is the documented order. Reproduced in production. | Confidence, trust |
| 2 | F4 | VERIFIED condition / OBSERVED FRICTION | A product that cannot serve the team still shows a numeric score and a solid Visit, and stays selectable. Quillo at team 10: "38 / 100", "Not available for 10 · Supports at most 5 seats", Visit present. The 38 is an artefact (value area forced to 0), not a judgement. | production row; `score.ts` `valueRatio` returns 0 when ineligible | Comprehension, relevance |
| 3 | F8 | STRONG HYPOTHESIS | False precision. At team 10, six products sit within 74–68. The 4-pick verdict reads "scores 74, 2 points ahead of Mondray. It leads no single area, but has the best balance". Weights are fixed editorial choices (disclosed). Mitigations exist (trade-offs, method). Hypothesis: users read a 2-point lead as a recommendation of the same strength as a large one. | scoring sweep; production verdict text | Confidence |
| 4 | F9 | OBSERVED FRICTION | Ranking depends strongly on team size: winner Stackhaven at 1, Northlane at 3–50, Cairnpoint at 100+; Taskara goes from last (1) to 3rd (25). Default 10 is applied without asking. | production sort at 1/10/25/100 | Relevance |
| 5 | F7 / F6 | OBSERVED FRICTION | Phone: no product in the first viewport (first row at 854 px); head-to-head 5,179 px (2 picks) to 10,265 px (4 picks, key) and 13,925 px (complete). | production measurements | Effort |
| 6 | F5 | VERIFIED condition | Phone head-to-head: one Visit (winner, verdict). Desktop matrix: Visit per pick. A phone user persuaded by "Choose Taskara if budget comes first" must go back to the table. | production; `HeadToHead.tsx` `Stacks` renders no CTA | Effort at the decision moment |
| 7 | F10 | UNVALIDATED HYPOTHESIS | No way to state a must-have (SSO, time tracking, guests). A buyer with a hard requirement scans 15 + 6 feature rows. The rejected "needs-first questionnaire" (context.md) is a different, heavier idea. | code; no user evidence | Relevance, effort |
| 8 | F3 | VERIFIED DEFECT | All six Related-category links (`/compare/<slug>/`) return 404. Users who decide the category is wrong hit a dead end. | `curl` 404 on two slugs; `Related.tsx` comment says pages are not built | Exit quality |

Not friction (verified strengths, keep): price arithmetic visible per row; one strength and one limitation per row; trade-off reasons with numbers and evidence links; counted views (nothing hidden); disclosure next to the money; URL-shareable state.

---

## 4. Commercial funnel map

| Stage | Defined? | Event today | Collected in production? | Gap |
|---|---|---|---|---|
| Page view | yes | `comparison_page_viewed` | **no** (no tag manager) | P1 |
| Product impressions / exposure | no | none | no | position and sort not recorded (F13) |
| Product evaluation | no | `team_size_changed` only; sort and Details untracked | no | deliberate; see §5 |
| Selection | yes | `product_selected` / `_deselected` | no | P1 |
| Comparison engagement | yes | `comparison_started`, `comparison_view_changed`, `comparison_shared` | no | **F2: scroll start fails on phones/tablets** |
| CTA exposure | no | none | no | not worth an event yet (§5) |
| CTA click | yes | `product_cta_clicked` (`placement`, `winner_id` in envelope) | no | P1; F13 |
| Qualified outbound | **UNDEFINED** (VCVR undefined) | none | no | P4 definition |
| Verified conversion | specified | `attributed_conversion` (server spec) | no | P2 click id + network sub-id, P3 import |
| Revenue | no | none | no | partner agreements |
| Gross Profit | repo-proposed formula, not business-confirmed | none | no | P2–P4, cost data |

**Can profitability be analysed by product, position or segment?** By product and placement: yes once P1–P3 exist. By ledger position: **no**, even after P1, because the click event carries neither the row position nor the active sort, and the sort is not in the envelope (F13). By segment: team size and selection are in every event; device and source need the tag manager.

**Exposure bias:** the default sort is by score, so the top three for the team get the first viewport on desktop (3 rows intersect at 1440×900, ~1.5 unobstructed with the pinned empty tray). Whether this creates disproportionate clicks is NOT MEASURABLE today (F13).

---

## 5. Analytics audit

### Metric definitions

| Metric | Status | Source |
|---|---|---|
| CVR | **UNDEFINED** | experiment-plan open question 1 |
| VCVR | **UNDEFINED** | same; the organisation's own definition is required |
| Gross Profit | **PROPOSED, unconfirmed**: approved attributed revenue − direct costs (network fees, attributable paid acquisition), warehouse-side. **NOT MEASURABLE** | tracking-plan.md |
| Outbound CTR | measurable in principle from `product_cta_clicked` / `comparison_page_viewed`; **not collected** | — |

### Event inventory (contract v1, `src/lib/track.ts` → `window.dataLayer`)

Envelope on every event: `schema_version`, `page_view_id` (memory only), `ts`, `team_size`, `selected_ids`, `selected_count`, `winner_id`, `comparison_view`. No cookies, no storage, no PII (verified: empty `document.cookie` and `localStorage` in production).

| Event | Trigger | Own payload | Source | Stage | Purpose | Validation | Limitations |
|---|---|---|---|---|---|---|---|
| `comparison_page_viewed` | after hydration | `from_shared_link` | App.tsx | landing | denominator | prod (this audit), unit, E2E | — |
| `team_size_changed` | stepper/input settles (1 s) | `from`, `to` | App.tsx | orientation | personalization uptake | E2E | — |
| `product_selected` | pick added | `product_id`, `slot`, `source` | App.tsx, HeadToHead | shortlist | activation | E2E | no list position or sort (F13) |
| `product_deselected` | pick removed | `product_id`, `source` | App.tsx | shortlist | churn of picks | E2E | — |
| `comparison_full_blocked` | 5th pick | `product_id` | App.tsx | shortlist | 4-limit pressure | E2E | — |
| `comparison_started` | "Compare N" (`tray`) or section ≥15% visible (`scroll`) | `trigger` | Tray, HeadToHead | comparison | comparison activation | prod desktop ✔; **prod phone/tablet ✘ (F2)** | **threshold unreachable when the section is taller than viewport ÷ 0.15** |
| `comparison_view_changed` | view control / verdict link | `from`, `to`, `rows`, `trigger` | HeadToHead | comparison | depth needed to decide | prod (this audit), E2E | — |
| `product_cta_clicked` | any Visit | `product_id`, `placement`, `destination_host` | Visit.tsx | exit | the commercial event | prod (this audit): payload and URL correct | no click id; no position/sort; `utm_content` = placement only |
| `comparison_shared` | link copied | `method` | HeadToHead | comparison | advocacy | E2E | — |
| `email_capture_submitted` | form valid | `alerts_opt_in` | EmailList | retention | capture | E2E | no backend; demo only |

**F2 detail (VERIFIED DEFECT).** `HeadToHead.tsx` observes `#compare` with `threshold: 0.15`. An element taller than `viewport height ÷ 0.15` can never reach that ratio. Measured in production after scrolling the whole section:

| Viewport | Picks | Section height | Max ratio | `comparison_started(scroll)` |
|---|---|---|---|---|
| 1440×900 | 4 | 3,948 | 0.228 | fired |
| 375×812 | 2 | 5,179 | 0.157 | fired (barely) |
| 375×667 | 2 | 5,179 | 0.129 | **never** |
| 375×812 | 4 | 10,265 | 0.079 | **never** |
| 768×1024 | 4 | 9,599 | 0.107 | **never** |

Consequence: shared-link visitors and anyone who scrolls rather than presses "Compare N" are not counted as comparing on most phones and tablets. Comparison activation, and any "CTA after comparison" metric, would be biased by device and by pick count. Fix shape: fire when the section's top enters the viewport (threshold 0, or a fixed-pixel `rootMargin`), not on a ratio of its height.

### Minimal measurement framework

Questions worth answering, and the smallest change that answers each:

| Question | Needed | Status |
|---|---|---|
| Do visitors personalize before acting? | `team_size_changed` before first selection/CTA | exists |
| Does comparison precede better clicks? | `comparison_started` reliable on all devices | **fix F2** |
| Are clicks driven by position or by fit? | `list_position` and `sort` on `product_cta_clicked` and `product_selected` (two fields, no new event) | add |
| Which clicks convert and earn? | `click_id` on click + network sub-id + server import | blocked on P2/P3 |
| Does the verdict steer clicks? | `winner_id` vs `product_id` | exists |

Do **not** add now: per-row impressions, CTA-exposure events, Details-open events, hover or scroll-depth tracking. None answers a decision this audit has identified, and each adds consent surface. Revisit Details-open only if research shows Details is a decision step.

Privacy: unchanged rule set. Nothing is collected until a consent platform gates the tag manager (P1).

---

## 6. CRO opportunity register

Effort: S = copy/CSS or one function; M = component change; L = new data or infrastructure. Confidence refers to evidence that the problem exists, not to uplift.

**O-A. Consistent ranking order** (decision-support correction)
1 F1 · 2 Table orders equal scores against the published rule · 3 production at team 10/100; `Ledger.tsx` · 4 table and verdict disagree on who is ahead · 5 Evaluation → Decision · 6 use `compareScored` for the Score sort · 7 consistency preserves trust in the verdict · 8 none needed (correctness) · 9 none · 10 high · 11 S · 12 low (sort-order E2E) · 13 none · 14 unit test on order + E2E.

**O-B. Honest state for products that cannot serve the team** (decision-support correction; commercial gate)
1 F4 · 2 score 38 and solid Visit on an unservable product · 3 production · 4 a number that means "not applicable" reads as "bad"; an outbound click to a product that cannot fit · 5 Evaluation, Exit · 6 replace the number with "Not scored for N" (product stays listed, last, selectable); show its Visit as quiet rather than solid · 7 removes a misleading signal; lowers clearly unqualified exits · 8 share of CTA clicks on ineligible products (should fall) · 9 total qualified clicks; GP per visitor when measurable · 10 high for the condition, hypothesis for impact · 11 S–M · 12 low; touches the commercial surface → approval gate · 13 P1 to observe · 14 E2E for the state; observational afterwards. Removing the Visit entirely is **not** recommended: a 5-seat tool can still fit a sub-team.

**O-C. Reliable comparison measurement** (analytics prerequisite)
1 F2, F13 · 2 scroll start never fires on most phones/tablets; no position/sort on clicks · 3 production measurements; `track.ts` · 4 none for the user; funnel blind spot · 5 Comparison, Exit · 6 fix the observer; add `list_position`, `sort` fields · 7 n/a · 8 n/a · 9 event volume sanity · 10 high · 11 S · 12 low (contract change, documented) · 13 P1 to collect · 14 Playwright at 375/768/1440 asserting one start per set.

**O-D. Per-pick Visit in the phone head-to-head** (commercial progression; parity with desktop)
1 F5 · 2 desktop matrix offers Visit per pick; phone offers the winner only · 3 production · 4 the user who chooses a non-winner from a trade-off must leave the comparison to act · 5 Decision → Exit · 6 a quiet Visit per pick in the phone stack key, new placement `matrix-phone` · 7 action at the moment of decision · 8 CTA clicks after `comparison_started` on phones · 9 winner click share, attributed conversion per click when measurable, no overlap at 320 px · 10 high for the gap; impact unvalidated · 11 M · 12 low–medium (layout at 320 px) · 13 P1; contract update · 14 ship as parity fix, then observe; A/B only if traffic allows.

**O-E. Related-category dead ends** (usability correction)
1 F3 · 2 six 404 links · 3 production `curl` · 4 dead end for users in the wrong category · 5 Exit without deciding · 6 render as plain text marked "coming soon", or remove the section until pages exist (U-4 asks for the section, so keep it as text) · 7 no broken promise · 8 n/a · 9 n/a · 10 high · 11 S · 12 low · 13 none · 14 E2E: no `/compare/` links that 404.

**O-F. Near-tie disclosure in the verdict** (decision-support experiment)
1 F8 · 2 a 1–2 point lead is stated like a large one · 3 sweep + verdict text · 4 over-confidence in a balance artefact, or distrust once noticed · 5 Decision · 6 when the margin is ≤ a stated band (e.g. 3 points), the verdict says "effectively tied on score; here is what separates them" and leads with the trade-offs · 7 calibrated confidence; moves attention to the user's own criteria · 8 comprehension-test accuracy ("why is X first, what do you give up?") · 9 time to decision; CTA on winner vs others · 10 medium · 11 S–M · 12 medium: can be read as indecisive · 13 research only at first · 14 task-based comprehension test (5–8 participants, two prototypes).

**O-G. Team size asked before the ranking** (decision-support experiment)
1 F9, F6 · 2 ranking flips with team size; default 10 silent · 3 sweep + production · 4 a visitor with 40 people sees a ranking for 10 · 5 Orientation · 6 state "Ranked for a team of 10, change" at the top of the table, or the stepper in the hero (E5) · 7 relevance before evaluation · 8 share of visitors with `team_size_changed` before first CTA · 9 time to first action; phone first-product position must not get worse · 10 medium (condition verified; behaviour unknown) · 11 M · 12 low–medium (phone fold) · 13 P1, 2-week baseline of the 8 · 14 observational first (how many already change it); then prototype test.

**O-H. Must-have filter** (decision-support, research first)
1 F10 · 2 one personalization axis · 3 code only · 4 hard requirements need a full scan · 5 Evaluation · 6 one optional "Must have" chip row (SSO, time tracking, guests…) that marks rows that fail, without re-weighting the score · 7 elimination of unsuitable options · 8 — · 9 — · 10 low · 11 M–L · 12 medium (complexity, score credibility) · 13 research · 14 interviews / first-click study before any build.

> **U-6 (2026-10-10):** O-F, O-G and O-H are product-experience backlog items (`.design/context.md`, iteration 6), assessed by heuristic review and usability walkthroughs. Their problem evidence (fields 1–7) stands; the experiment, instrumentation and baseline fields (8, 9, 13, 14) are historical and no longer gate them.

**O-I. Ledger Visit visual weight** (commercial experiment; existing E1) and **O-J. destination-specific CTA labels** (existing E6): unchanged from `experiment-plan.md`; both blocked on P1–P5 and real destinations. Out of scope under U-6.

---

## 7. Top five recommendations

1. **Make the funnel observable (O-C + P1).** Fix the scroll trigger, add position and sort to clicks and selections, and get a consented tag manager reading `dataLayer` in production. Today no recommendation in this document can be evaluated, and F2 would bias the first data by device. Helps: *advance* (measurable progression), and makes every other item testable. *(Historical, U-6: the scroll-trigger and payload fixes shipped as tracking v2; a production tag manager is out of scope.)*
2. **One ranking order everywhere (O-A).** The page publishes a tie rule the table breaks. A user who notices the table and verdict disagree has a reason to distrust the verdict. Helps: *decide*. Smallest diff in this audit.
3. **Stop scoring what cannot be scored (O-B).** Removes a misleading number and demotes an exit that cannot fit the stated team. Helps: *compare* and *decide*; plausibly raises the share of qualified clicks. Commercial-surface approval required.
4. **Per-pick Visit in the phone head-to-head (O-D).** The decision moment on phones has no action for 1–3 of the picks, unlike desktop. Helps: *advance* from a confident decision without a 5–10k px scroll back.
5. **Remove the dead ends (O-E).** Six 404s on the page. Helps: retention of users who are in the wrong category; protects credibility.

Why these over further visual refinement: Phase B closed the measured layout and accessibility defects. Each item above addresses a verified behaviour (wrong order, misleading score, missing action, broken link, blind metric). None is a matter of taste, and four are small.

Deliberately not in the top five: near-tie disclosure (O-F) and team-size prompt (O-G) have verified conditions but unknown user impact. They go to research and experiments, not straight to production. *(Historical, U-6: they are now product-experience backlog items, assessed by heuristic review and usability walkthroughs.)*

---

## 8. Experiment backlog

A/B testing is not possible today: no traffic data, no assignment platform, no outcome metric. The methods below fit the current evidence.

> **Historical (U-6, 2026-10-10):** no experiment, A/B test or analytics baseline will be run. The questions behind X1 (near-tie comprehension) and X3 (which must-haves eliminate tools) carry over to the usability walkthroughs for O-F and O-H; X2, X4 and E1/E6 depended on collected analytics and are dropped.

| # | Problem | Hypothesis | Control → Variant | Primary outcome | Guardrails | Instrumentation | Method | Interpretation | Risks |
|---|---|---|---|---|---|---|---|---|---|
| X1 | F8 | Saying "effectively tied" for small margins improves verdict comprehension without reducing decisions | current verdict → near-tie wording + trade-offs first | correct answers to "why is X first, what do you give up?" | completion of the task; stated confidence | none (prototype) | moderated task test, 5–8 per arm, within-subject order balanced | ship only if comprehension clearly improves and no participant reads it as "no recommendation" | small n, directional only |
| X2 | F9 | Visible "ranked for a team of N" raises team-size adjustment before first action | current → table-head statement with change link | share of page views with `team_size_changed` before first selection/CTA | phone first-product position; time to first action | O-C + P1 | observational baseline 2 weeks, then pre/post or A/B if volume allows | a change is meaningful only against the baseline's week-to-week variation | seasonality in pre/post |
| X3 | F10 | Buyers eliminate tools by one or two hard requirements | — | which attributes participants use to eliminate | — | none | 6–8 decision interviews with real PM-tool buyers + first-click on a filter prototype | build O-H only if a small set of must-haves recurs | recruiting real buyers |
| X4 | F5 | Phone per-pick Visit increases clicks after comparison without moving clicks from relevance to position | parity fix shipped; observe | `product_cta_clicked` with `placement=matrix-phone` per phone comparison | winner click share; overlap at 320 px | O-C, P1 | observational after ship | interpret as availability, not uplift, without a control | no counterfactual |
| E1 / E6 | see `experiment-plan.md` | | | GP per eligible visitor | | P1–P5 | A/B once powered | | blocked |

No statistical-significance claims are possible without sample-size and outcome data. Sample-size lookups are in `experiment-plan.md` §5.

---

## 9. Rejected ideas

| Idea | Why rejected |
|---|---|
| Rank or highlight products by commission | Breaks the published promise ("commission is not an input to the score"); trust damage outweighs any click gain |
| "Most popular", "X people compared this today", urgency or scarcity badges | No real data; would be fabricated social proof (U-1) |
| Removing ledger Visit buttons to force comparison | Direct exit is a valid journey; no evidence comparison-first clicks are worth more |
| Sticky "Visit winner" bar or exit-intent pop-up | Repeats the CTA without new information; pressure before readiness |
| User-weighted score sliders | Already rejected (context.md): the verdict becomes a mirror of the sliders, not an explainable judgement |
| "Start free trial" labels now | Destinations unverified (E6); would promise something the link may not deliver |
| Email-gating the head-to-head | Adds friction at the value moment; no ESP exists to deliver anything |
| Auto-selecting the top three on load | Pre-empts the user's choice; "Try the top three" already exists as an explicit action |
| Tracking hovers, scroll depth, every Details open | Answers no identified decision; adds consent surface |
| Collapsing limitations or "Watch out" to reduce density | Hides the information that makes the comparison fair |
| More visual polish on the table or tray | Phase B closed the measured defects; no evidence ties further polish to comparison, decision or progression |

---

## 10. Proposed Phase C

Bounded to items with verified conditions. Each block lists its gate.

**C0 Measurement foundations (code, deployable)**
- Fix `comparison_started(scroll)` so it fires once per set on every viewport (F2).
- Add `list_position` (1–10, current table order) and `sort` to `product_cta_clicked` and `product_selected` (F13); document in `tracking-plan.md`.
- Tests: Playwright at 375×667, 768×1024 and 1440×900 for one start per set; unit test for the new fields.
- Files: `HeadToHead.tsx`, `track.ts`, `Visit.tsx`/`Ledger.tsx` (pass position), `tracking-plan.md`, tests.
- Gate G1: approval of the contract change.

**C1 High-confidence corrections (code, deployable)**
- Score sort uses `compareScored` (F1).
- Ineligible products: "Not scored for N" instead of a number; quiet Visit (F4). Gate G2: approval, because it changes a commercial surface.
- Phone head-to-head: quiet Visit per pick, placement `matrix-phone` (F5). Gate G2, plus a 320 px layout check.
- Related categories: non-link "coming soon" text (F3).
- Out of scope: any change to weights, prices, data, URLs, UTMs or the verdict copy.

**C2 Decision-support ideas (moved to the product-experience backlog, 2026-10-10)**
- Near-tie wording (O-F), a visible "ranked for a team of N" (O-G) and a must-have filter (O-H) are design candidates, judged by heuristic review and usability walkthroughs. No live experiment, no research budget gate.

**C3 Commercial optimization: OUT OF SCOPE (2026-10-10, U-6)**
- E1 ledger Visit weight, X2 team-size prompt as A/B and E6 labels need real traffic, revenue and an experiment platform, which a portfolio demonstration does not have. Gates G4–G6 (metric definitions, consent platform and tag manager, destinations and conversion import) no longer apply.

Dependency order as shipped: G1 → C0-A → (G2) C1 → closed. C0-B and C3 are out of scope.

---

## Final quality gate

| Recommendation | Evidenced? | Easier comparison? | Confidence kept or improved? | Could raise qualified progression? | Measurable? | Trust risk | Worth effort? | Verdict |
|---|---|---|---|---|---|---|---|---|
| O-C measurement | yes (prod) | — | — | enables measurement | yes, by definition | none | yes (S) | **keep, first** |
| O-A tie order | yes (prod + code) | yes | yes | indirectly | via E2E only | none | yes (S) | **keep** |
| O-B ineligible state | yes (prod) | yes | yes | plausibly (fewer unfit clicks) | after P1 | low if Visit kept | yes (S–M) | **keep, gated** |
| O-D phone Visit | yes (prod) | — | — | plausibly | after P1 | low | yes (M) | **keep, gated** |
| O-E 404s | yes (prod) | — | yes | — | E2E | none | yes (S) | **keep** |
| O-F near-tie | condition yes, impact no | — | unknown | unknown | research | medium | research only | ~~defer to X1~~ **backlog (U-6)** |
| O-G team prompt | condition yes, impact no | — | — | unknown | after P1 | low | after baseline | ~~defer to X2~~ **backlog (U-6)** |
| O-H must-have filter | no | maybe | maybe | unknown | research | medium | not yet | ~~defer to X3~~ **backlog (U-6)** |
| E1 / E6 | partial / blocked | — | — | unknown | no | medium | no | ~~blocked~~ **out of scope (U-6)** |

Outcome (U-6, 2026-10-10): O-A, O-B, O-D, O-E and the O-C payload fixes shipped in 46854fd; O-C's production collection is out of scope.

Reminders that shaped this report: a higher outbound CTR is not higher Gross Profit; nothing here is a measured user reaction; production data, traffic and revenue were not available to this audit.

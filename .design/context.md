---
schema_version: 2
project_state: greenfield
register: hybrid
genre: modern-minimal
dials: { variance: 5, motion_intensity: 2, visual_density: 7 }
last_updated: 2026-10-02
---

# Prodcom — design context

Classification: page-scope BUILD on a genuinely-empty project (single landing page, full pipeline).
Register/genre/dials: hybrid modern-minimal, variance=Medium (5), motion=Low (2), density=Medium (7).

Why hybrid: the page must orient and persuade lightly (what Prodcom is, why trust the verdict), but its core is product UI (a working comparison instrument). Product-led ceilings apply to the comparison surfaces.
Why modern-minimal (evidence, not category default): the brief's own priorities are "clarity, information hierarchy, data legibility, disciplined color, excellent typography, coherent density"; style-catalog STYLE-MODERN-MINIMAL-01 `best_for` "product UI ... utility tools". Editorial was weighed and rejected (Rejected Directions).
Why density 7 (Medium, upper): a 10-row × 6-column ledger and a 40-row matrix must be scannable without becoming a spreadsheet; Register (hybrid) keeps it below High.

## Product Truth

Brief-supplied requirements (records):

- **T-1** truth · active · Prodcom ("Product Compare") is a fictional software-comparison product; this deliverable is its landing page, which must behave as a real interactive comparison experience.
  src: brief, 2026-10-02
- **T-2** truth · active · User job: understand differences between several software products, narrow the field, and compare the strongest candidates in enough detail to choose confidently.
  src: brief, 2026-10-02
- **T-3** truth · active · Exactly 10 fictional products; no real commercial software names; every price, rating, review count and feature is demo data and must not be presented as coming from real customers or external sources.
  src: brief, 2026-10-02
- **T-4** truth · active · Every product has a selection control; 0 to 4 may be selected. The maximum of 4 is a hard product rule. Selection works with mouse, keyboard and touch.
  src: brief, 2026-10-02
- **T-5** truth · active · A detailed comparison below the primary table shows only the selected products: intentional empty state at 0, guidance (not a fake comparison) at 1, thorough side-by-side at 2–4.
  src: brief, 2026-10-02
- **T-6** truth · active · Among 2–4 selected products a "best overall" is chosen by a deterministic, explainable scoring model, visually differentiated without relying on color, and never implying "best for everyone".
  src: brief, 2026-10-02
- **U-1** directive · active · No fabricated testimonials, customer logos, usage statistics, awards or social proof; no fabricated external citations.
  src: brief, 2026-10-02
- **U-2** directive · active · Do not modify the Design Excellence skill or anything outside this repository; no push, no remote, no deploy.
  src: brief, 2026-10-02

Authorized fictional demo data (invented by this run under the brief's explicit authorization, disclosed on the page): product names, marks, positioning, prices, billing models, seat limits, ratings, review counts, feature availability, limits, platforms, integrations counts, support tiers, security/compliance attributes, trials, strengths, limitations. Category chosen for the dataset: project and work-management software (one category, so the comparison is meaningful).

Hypotheses (not facts): a buyer usually knows their team size before anything else, so price is most useful stated for their team (PRN-0104 adoption below); most buyers narrow from 10 to 2–4 before reading details.

Concept detection: **DETECTED / EVIDENCED** — the brief states the name's rationale ("Meaning: Product Compare"). LAYOUT-009 translation: (1) brief concept: product compare; (2) abstract structural principle: the page is an instrument for setting items against each other on shared axes, not a story about comparing; (3) structural expression: macrostructure (the ledger is the page's first real surface, the second surface is the head-to-head matrix generated from the user's marks) and interaction (selection is the only way to advance the page).

## Problem profile

Surface role: browse/compare, then decide (light persuasion only for orientation and trust). Primary task: one considered purchase decision, done rarely, in one sitting of 5–20 minutes, revisited when sharing with colleagues. Density: medium-high (10 records × ~45 attributes). Navigation: single page, one role, no auth. Data/workflow: 10 records, shared attribute schema, user-made subset of ≤4, derived score. Device: laptop primary at reading distance; phone used to shortlist or review a shared comparison; 320 px floor. Brand ambition: moderate; credibility and legibility over expression.

## Visual System

Direction record (committed: **"The Ledger and the Head-to-head"**):

- Composition and shell: thin masthead (wordmark, one-line proposition, demo disclosure, team-size input, three-step orientation in one line) → the Ledger (all 10 products in one table, the page's main surface) with a selection tray pinned to the bottom of the ledger section → the Head-to-head (verdict + grouped matrix of only the selected products) → How the score works → footer disclosure. No hero, logo strip, feature cards, testimonials or FAQ (SLOP-020 avoided; each section maps to a step of T-2).
- Density handling: ledger shows 6 decision columns only; everything else is progressive disclosure (row details) or lives in the Head-to-head. The matrix groups ~40 rows into 8 decision groups, each with its own leader line, plus a "differences only" filter that states how many rows it hides.
- Adopted references:
  - REF-017 (composition) → the comparison table is the composition, not a widget: ledger directly under a thin masthead, aligned numeric columns, row-level selection state, summaries as a thin control bar (team size, sort) above it rather than tiles.
  - REF-026 (data) → values shown against their real limit: the tray's 4 slots ("2 of 4"), feature coverage as "11 of 15", seat limits as fit/doesn't-fit for the user's team size.
  - PRN-0104 (data/interaction) → price computed from the quantity the buyer knows (team size): every price is "for N people", with the arithmetic visible ("10 × $14"), products that cannot serve N people flagged and excluded from the verdict, and the value sub-score recomputed. The brief explicitly authorizes inventing prices and billing models, so the formula is authorized demo data, not an invented external rate.
  - REF-022 (composition, phone adaptation only) → on phones the alternatives stay co-present per attribute (attribute-first stacks: each attribute lists the 2–4 selected values together) instead of one product per swipe card.
- Shortlisted and rejected: REF-001 (a fixed orienting column would steal the width the comparison columns need; orientation is carried by sticky product headers instead); REF-003 (slot numbers 1–4 are functional identifiers, not an index navigation; an index would be decorative); REF-037 (10 items fit one screen; counted filters add overhead with no benefit, sorting is kept instead); REF-009 (a rule-segmented figure strip for the verdict is a SLOP-021 repeat default; the verdict is a short argued statement plus "leads on" lines); REF-008 (the user is not mid-procedure; orientation is still needed).
- Distinctive structural moves: (1) team size is a global input that re-prices the whole ledger and can change the verdict; (2) selection is a 4-slot tray with numbered slots that reappear as column/stack keys in the Head-to-head, and a full tray offers "replace" instead of a dead control.
- Why this composition is right: the job (T-2) is narrow → compare; a ledger lets the user see the whole field before committing, and the user's own marks generate the second surface, so the page is literally the comparison. What would have to differ: if the catalogue had hundreds of products, a search/filter-first composition (REF-037) would replace the ledger; if buyers lacked a known quantity like team size, price would be shown as fixed tiers.
- Imagery (LAYOUT-008): (1) no imagery beyond typography and color — the data is the content and stock imagery would imply false product screenshots; (2) medium: an abstract geometric mark per product (identity aid only, decorative, `aria-hidden`); (3) role: wayfinding between ledger, tray and matrix; (4) the marks sit in the key column of every surface.

- **D-1** decision:P6 · active · Macrostructure: masthead → Ledger (all 10) → Head-to-head (selected only) → Method → footer. No marketing skeleton sections.
  src: BUILD DIRECT 2026-10-02 · deps: T-2, T-5
- **D-2** decision:P5 · active · Team size (1–500, default 10) is the single global input; all prices are monthly cost for that team on annual billing, with per-seat arithmetic visible.
  src: BUILD DIRECT 2026-10-02 · deps: T-3
- **D-3** decision:P5 · active · Selection state lives in the URL (`?compare=a,b&team=10`) so a comparison can be shared and restored.
  src: BUILD DESIGN 2026-10-02 · deps: T-4
- **D-4** decision:P5 · active · Winner treatment: pastel highlighter fill on the winner's column/stack plus a text label "Best overall" and a thicker top rule; never color alone.
  src: BUILD DESIGN 2026-10-02 · deps: T-6

Tokens (OKLCH, COLOR-004 construction; anchor = slate ink on cool paper):

- paper `oklch(98.6% 0.004 230)`, paper-2 (zebra/sections) `oklch(96.2% 0.007 230)`, rule `oklch(87% 0.012 235)`, ink `oklch(24% 0.03 245)`, ink-2 (secondary text) `oklch(44% 0.025 245)`.
- pick (the user's own marks: selection, slot numbers, focus) `oklch(46% 0.115 200)` deep teal-ink; pick-tint `oklch(95% 0.03 200)`; on-pick white.
- best (winner highlighter) `oklch(95% 0.065 96)` butter; best-ink (label/rule on it) `oklch(43% 0.09 75)`.
- warn (limit/fit messages) `oklch(47% 0.13 40)` on paper.
- Color commitment: Restrained (COLOR-001, product-led ceiling), Medium variance moves one rung: the pick teal is used structurally (selected rows, tray, slot keys), not as a decoration accent.
- Typography: one family, **Archivo** variable (wght 400–800, wdth 62–125). TYPE-002 voice words: candid, tabulated, engineered; physical object: a parts catalogue's spec table. The width axis is the hierarchy device: expanded heavy for the wordmark and section titles, normal for body, semi-condensed for dense column headers; tabular figures for all numbers. Reflex grotesques considered and rejected (SLOP-014). Product-register fixed scale (TYPE-005): 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.5 rem.
- Spacing: 4px base; Medium density rhythm (LAYOUT-007): 8–12px within groups, 24–32px between groups, 64–88px between page sections.
- Shape: radius 3px on controls and table, 10px on the tray only (the one floating object); a single soft shadow only on the pinned tray. No cards for products.
- Motion tier: Low. Only state feedback (selection fill 120ms, tray slot fill, limit message fade) and the jump to the Head-to-head (smooth scroll only without reduced motion). Hover gated (MOTION-008); focus instant (MOTION-009); reduced motion removes movement (MOTION-007).

### Iteration 2 (2026-10-02): decision efficiency in the Head-to-head

Classification: section-scope REDESIGN of the Head-to-head on an existing project; register/genre/dials reused (hybrid, modern-minimal, 5/2/7).

Diagnosis (measured on the production build):
- 320 px, 4 picks: Head-to-head ≈ 14,300 px; 50 attribute rows; only 7 identical. 375 px, 3 picks: 10,900 px, 10 identical. 1440 px, 2 picks: 3,980 px, 13 identical.
- "Show only differences" barely shortens a diverse selection, because almost every row differs. Its premise (different = matters) is wrong for the job.
- The real cost is unweighted evidence. There is a six-claim verdict, then 50 rows of equal weight, with nothing that says which rows explain the verdict or where the winner loses. Questions 1–3 are answered in the verdict; 4 (which differences matter), 5 (where another product beats the winner) and 6 (evidence for a claim) require reading every row. Verdict claims are not linked to the rows that prove them.
- On phones each attribute costs about 190–310 px (four product lines), so unweighted evidence becomes scrolling cost. Product context is not lost (names on every line plus a sticky key), and attribute context is not lost (heading per attribute). The length is a symptom, not the problem.
- Repetition is real but minor: identical rows on phones repeat the same value four times.
- Desktop masthead (≈390 px at 1440×900): the ledger heading, team-size input and column heads are in the first viewport; the first data row starts at about y=590. The ledger is about 1,000 px tall on its own, so no masthead size shows all ten rows; the masthead carries the proposition, the demo disclosure and the orientation that first-time visitors need. Judged not materially harmful (SI-2: the intent "reach the field quickly" is met), so it is unchanged.

Problem profile: deep but infrequent reading of a decision among 2–4 alternatives; quick verdict first, then evidence on demand; 50 attributes; phone and laptop; the user returns to it when sharing.

Expected magnitude: moderate and contained to the Head-to-head (rows model, verdict, comparison controls, phone stacks, CSS). The page macrostructure, ledger, tray, scoring model, tokens and URL contract are unchanged.

Committed response, "Evidence ranked against the winner":
- Every row is classified deterministically against the winner using an ordinal rank per attribute (feature level, price, score, rating, counts, learning curve, response time, uptime): winner behind, winner ahead, differs (not ordinal), or same.
- A view control replaces the binary switch. It offers "Where <winner> is behind (n)", "All differences (n)" and "Everything (n)", and each option shows the number of rows it leaves (REF-037). The default stays "Everything", so depth is never hidden by default.
- Rows where the winner is behind carry a text flag. Rows that are the same for every pick recede (REF-015: quiet by default, loud by exception).
- Each group header states the winner's position ("Northlane ahead on 3, behind on 1, 2 the same").
- Verdict claims link to their evidence. Each "Choose X if" reason links to the group that proves it, and the verdict links to the "is behind" view.
- On phones, rows identical for every pick collapse into one "Same for all" line instead of repeating.

References (new shortlist for this problem): REF-037 adopted (counted view options); REF-015 adopted (emphasis only for rows where the winner is behind, same rows quiet); PRN-0003 rejected (its do_not_apply_to excludes working product views); REF-022 not re-adopted (already carried; no new decision); REF-014 rejected (one-at-a-time triage, not cross-record comparison).

Alternatives rejected:
- Groups collapsed into accordions by default: 10 extra taps, hides most evidence behind disclosure cost.
- One product per tab or swipe on phones: breaks per-attribute co-presence, which is the comparison itself.
- Deleting low-value rows (templates, storage, web app): reduces depth for little gain; the view control handles priority.
- A horizontal-scroll mini-table on phones: four values at about 70 px each are unreadable, and it adds two-dimensional scrolling.
- Defaulting to "differences only": it hides absolute facts by default and barely helps a diverse selection.

Design anchors: ledger, tray, verdict panel, butter winner column with "Best overall" label, grouped matrix with sticky header, attribute-first phone stacks, Method section: all kept. The view control takes over the role of the differences switch.

## Constraints & Preserved Patterns

- Stack (declared this run): Vite 8 + React 19 + TypeScript 7, plain CSS, Playwright for E2E, `node --test` for logic, static prerender (renderToString at build) so all content exists without JavaScript (A11Y-009). No backend; dataset local in `src/data/products.ts`.
- Scoring model must stay deterministic and documented on the page (T-6); any change to weights updates the Method section in the same commit.

- **D-5** decision:P4 · active · Preserved contracts: query parameters `compare` (comma list, ≤4, slot order) and `team` (1–500); anchors `#ledger`, `#compare`, `#method`, `#top`; section headings "All ten tools", "Head-to-head", "How the Prodcom score works"; checkbox accessible names "Compare <product>".
  src: inspect:src/App.tsx, 2026-10-02

- **D-6** decision:P5 · active · Head-to-head view is shareable: `?view=behind|diff` (absent = Everything); additive to the D-5 contract, which is unchanged.
  src: REDESIGN BUILD 2026-10-02 · deps: D-3, D-5

## Known Exceptions

None.

## Rejected Directions

- 2026-10-02 · **"Needs-first buyer's guide"** (rejected). Opening questionnaire (team size, top 3 priorities with weight sliders) that ranks the 10 products into an argued long-form editorial guide (serif display, one product per reading block), with the comparison at the end. Distinct from the committed direction on composition (guided sequential narrowing vs. whole-field ledger), interaction (user-weighted ranking vs. direct selection of up to 4), typography (editorial serif vs. one width-variable grotesque). Rejected because: it hides the field behind questions, while T-2 starts with understanding differences across several products; a question-led long document for a data page is SLOP-021's first repeated default; style-catalog STYLE-EDITORIAL-01 `best_for` is "long-form content, publications…", which this is not, and user-set weights would make "best overall" a mirror of the user's sliders rather than an explainable verdict (T-6). Concept surface: macrostructure (sequential funnel). Hypothesis-derived elements: none.

## Fingerprint History

- 2026-10-02 · gen 1 · macrostructure: thin masthead → full-width ledger with pinned tray → generated head-to-head matrix → method · typography: Archivo single family, width axis as hierarchy · color-anchor: slate ink on cool paper, teal-ink selection, butter highlighter winner · density: Medium (7) · motion: Low.
- 2026-10-02 · gen 1 · **CRITIQUE Level 1 (pre-dispatch, recorded before Level 2 brief was written)** on build `26014df` + working-tree fixes (row dedupe, 320 px stack/key/tray fixes, replace-button wrap):
  1. Genericness 4/5. Skeleton derives from T-2 (ledger → user-generated head-to-head); no SLOP-020 marketing sections; SLOP-021 not triggered (no question-led document, no figure strip). SLOP-011 gestalt: not clusters 1/2/4; partial overlap with cluster 3 (hairline rules, near-zero radius) carried by a product reason (tabular data needs rules), not newspaper columns. Concept structural test: with logo, palette and copy removed, the page is still "whole field → your marks → generated comparison" — lives in macrostructure and interaction. Committed-dimension carriers: composition (whole-field ledger vs. funnel) carried; interaction (direct pick-up-to-4 + replace vs. weighted sliders) carried; typography (one width-variable grotesque vs. editorial serif) carried by expanded headings/wordmark and condensed column heads. Adopted references carried: REF-017 (ledger is first surface), REF-026 (4-slot tray, "x of 15", seat fit), PRN-0104 (team-size pricing with arithmetic, exclusion), REF-022 (attribute-first stacks on phones). Finding: on phones the masthead (~520 px at 375) pushes the first product below the fold.
  2. Hierarchy 4/5. Squint: score and price columns, selected rows and the winner column survive blur. Finding: in the ledger coverage bar, "limited" cells are weakly distinguished from "not offered" (text carries it).
  3. Distinctiveness: not assessable: first Fingerprint History entry.
  4. Craft 4/5 (layout-interaction, typography, color, content-copy, motion in scope). INTX-003 violation found and fixed (replace buttons wrapped at 320). Finding: matrix winner column fill is heavy across ~50 rows; finding: the redundant "Automation runs" row (removed).
  5. Accessibility: A11Y-001 pass (all text pairs ≥ 6.2:1, UI ≥ 5.5:1, computed from tokens); A11Y-002 pass (keyboard-only E2E, `:focus-visible` on every control, focus moved to refusal message and back); A11Y-003 pass (reduced-motion block, smooth scroll gated in JS); A11Y-004 pass (marks/glyphs `aria-hidden`, icon buttons named); A11Y-009 pass (prerendered: 10 ledger rows with JS disabled, E2E); A11Y-010 pass (root clip neutralised, 0 elements past viewport at 320 with tray-full state and details open); A11Y-011 pass (selection = filled numbered box + row bar + text; winner = "Best overall" label + top rule + column frame; best-in-row = text tags); A11Y-012 n/a (no dismissible overlays).
  6. Technical 4/5. LAYOUT-004 `clip` on html; MOTION-004/008/009 respected; tests: 10 unit + 11 E2E passing; no console errors.

- 2026-10-02 · gen 1 · **CRITIQUE Level 2** (fresh isolated `lexia-design:visual-critic`, literal rubric transport verified by substring check against `critique-protocol.md`; brief excluded `.design/` and all Level 1 results). Scores: Genericness 4, Hierarchy 4, Distinctiveness not assessable (first entry), Craft 3, Accessibility 3, Technical 4. Structural test: passes. Verdict "ship with fixes".
  Synthesis against the pre-dispatch Level 1: **disagreement on Accessibility and Craft.** Level 1 passed A11Y-004 and scored Craft 4; Level 2 found that below 900 px the tray slots exposed no product names to assistive tech (M2), that slot names broke mid-word at 1440 with one product selected (M1; Level 1's screenshots only covered 0 and 3 selected), and that the tray covered controls on phones (M3). All three were verified in code and adopted. Typography carrier: Level 2 judged the "width axis as hierarchy" claim barely perceptible; the claim is **revised by strengthening, not retracted**: section and group headings set at 125% width, column heads at 72%, so the axis now visibly separates headings from data labels.
  Corrections applied: M1 slot names `nowrap` with an actions column that wraps its hint instead of squeezing slots; M2 slot names always in the DOM (visually hidden below 600 px), test guard added; M3 empty tray is `position: static` below 900 px, replace panel shows names in a 2-column grid, `scroll-padding-bottom` grows while it is open; m1 remove control shown from 600 px (2-column slots between 600 and 899); m2 support line set small; m3 score shown as "N / 100" in ledger cards, matrix heads and verdict; m4 winner "Best" text kept below 420 px on its own line; m5 "Jump to" section select on phone stacks. Plus own Level 1 findings: tighter masthead, hatched "limited" coverage cells, removed duplicated "Automation runs" row, fixed INTX-003 wrap, fixed a flex-shrink bug that collapsed tray marks to 1 px (found while re-verifying).
- 2026-10-02 · gen 1 · **Level 1 re-run, formed after Level 2 (not independent of it):** Genericness 4, Hierarchy 4, Distinctiveness not assessable, Craft 4, Accessibility 4 (residual: replace panel covers the row being decided on phones while open; transient, focus is inside the panel), Technical 4.
- 2026-10-02 · gen 2 (iteration, section-scope REDESIGN of the Head-to-head) · macrostructure, typography pairing, color-anchor, density band and motion tier unchanged from gen 1 by design: the user instructed that the existing direction be preserved (P2), so the fingerprint repetition is declared, not a redirect signal.
- 2026-10-02 · gen 2 · **CRITIQUE Level 1 (pre-dispatch, recorded before the Level 2 brief was written)** on the working tree after commit 60e10ca:
  1. Genericness 4/5. The view control is named by the actual winner ("Where Northlane is behind") and counted (REF-037 carried); rows where the winner is behind are flagged in text and same rows recede (REF-015 carried); verdict reasons link to their evidence groups. Structural test still passes. Finding: a segmented control is a familiar pattern; its product reason is that the winner-relative classification has three useful cuts.
  2. Hierarchy 4/5. Verdict, then the "See where X is behind" bridge, then the view control, then the matrix. Finding: with 4 diverse picks the winner is behind someone on 19 of 50 rows, so the behind view still runs to about 7,300 px at 320 px (from about 14,300). The reduction is real but moderate, because "behind any pick" is a wide net. Finding: in the behind view the flag repeats on every row.
  3. Distinctiveness: declared repetition of gen 1 (see entry above); no redirect.
  4. Craft 4/5. A "Jump to" overflow at 320 px was introduced and fixed in this run. The selected view option was screenshotted mid-transition (settled colors verified).
  5. Accessibility: A11Y-001 pass (new pairs: warn flag 6.96:1, quiet rows ink-2 7.44:1, selected option ink/paper 15.8:1); A11Y-002 pass (native radios in a fieldset with a legend, focus visible through :has(:focus-visible), the verdict button moves focus to the control, evidence links move focus to the group header); A11Y-003 pass (focus jumps honour reduced motion); A11Y-004 n/a (no new icons); A11Y-009 unchanged (the head-to-head needs JS for selection; the ledger is still prerendered); A11Y-010 pass (no overflow at any floor width, root clip neutralised); A11Y-011 pass (behind = text flag plus bar, same = text "Same for all", selected view = fill inversion plus radio state); A11Y-012 n/a.
  6. Technical 4/5. 13 E2E (3 new), 10 unit, typecheck, build all pass; no console errors.
- 2026-10-02 · gen 2 · **CRITIQUE Level 2** (fresh isolated `lexia-design:visual-critic`; rubric re-extracted in the brief-writing step and verified as a verbatim substring of `critique-protocol.md`; `.design/` excluded from access; no Level 1 result in the brief). Scores: Genericness 4, Hierarchy 4, Distinctiveness not assessable (section inherits page fingerprint), Craft 3, Accessibility 4, Technical 4. Structural test: passes.
  Synthesis against the pre-dispatch Level 1: **disagreement on Craft (L1 4, L2 3)**. Level 2 found a correctness flaw that Level 1 missed, and I verified it in `rows.tsx`. Six ordinal rows (Typical setup, Seat limits, Desktop apps, Mobile apps; Storage and Support channels are genuinely unranked) had no rank, so the behind view under-reported, including the setup row the verdict itself cites. The empty-group note "X is not behind here" was therefore untrue. Other adopted findings: flags did not say whom the winner is behind; score-area rows double-counted their own evidence; the chosen view was not in the shared link; a mid-transition contrast dip on the selected view option; "Same for all" with 2 picks; evidence links landed on group tops. Agreement: the default view still costs as much as before (load moved, not dropped, for users who never switch views). This is accepted under the user's rule not to hide information by default, and mitigated by the verdict's "See where X is behind" bridge.
  Corrections: rank added to setup time (new demo field `setupDays`), seat limits, desktop and mobile apps; flag now reads "Northlane behind Taskara" (names every pick at the top rank); score areas marked `derived`, flagged in Everything but outside the behind count and view; truthful empty note ("not behind on any ranked row here; n other differences are in Everything"); `?view=behind|diff` added to the URL (absent for Everything); view option switches without a color transition; "Same for both" for 2 picks; evidence links focus the exact row (cost, learning curve, rating, support channels) and fall back to the group. Not adopted: evidence links for the winner's own "leads on" claims (the group standing lines already state where it leads); restoring the absolute "Most complete" line when a winner exists (the standing line supersedes it; it remains when there is no winner).
- 2026-10-02 · gen 2 · **Level 1 re-run, formed after Level 2 (not independent of it):** Genericness 4, Hierarchy 4, Distinctiveness declared repetition, Craft 4, Accessibility 4, Technical 4. Behind counts after the fix: 6 / 8 / 17 rows for the 2 / 3 / 4-pick sets tested (of 50). Head-to-head height in the behind view: 1440 with 2 picks 2,060 px (Everything 4,373); 375 with 2 picks 3,191 (8,604); 768 with 3 picks 3,701 (9,930); 320 with 4 picks 6,861 (14,348). Residual: a 4-pick behind view is still long, because "behind any pick" is a wide net.

## Accessibility Notes

- **C-1** check · active · Every interaction in the ledger, tray and head-to-head is operable by keyboard alone with visible `:focus-visible`; sticky headers and the pinned tray never hide the focused element (scroll-padding).
  src: BUILD DESIGN 2026-10-02 · deps: T-4
- Selection controls are native checkboxes with accessible names ("Compare Northlane"); limit and replace messages announced through a polite live region; winner announced in text.
- Real `<table>` semantics where data is tabular (ledger ≥ 1040px, head-to-head ≥ 960px), `th scope` for both axes; on narrow screens the same data uses lists with explicit "product: value" pairs.

## Responsive Notes

- **C-2** check · active · At 320 CSS px: all 10 products inspectable and selectable, max-4 enforced with replace, 2–4 selected comparable with verdict visible, no page-level horizontal scroll.
  src: BUILD DESIGN 2026-10-02 · deps: T-4, T-5, T-6
- Ledger: table ≥ 1040px; below, each product becomes a rule-separated block keeping the product name as the key line (REF-017 phone caveat).
- Head-to-head: table with sticky product header ≥ 960px; below, attribute-first stacks (REF-022) with a sticky key strip naming slots 1–4 and the winner, and a "Jump to" section select. A view control (behind / all differences / everything, with counts) sits above both; on phones its options stack. Rows identical for every pick collapse to one "Same for all" line on phones.
- Tray: sticky at the bottom of the ledger section; below 900 px it is static while empty; slot names visible from 600 px (2×2 slots 600–899), number + mark only below 600 with names kept for assistive tech.

## Retired

None.

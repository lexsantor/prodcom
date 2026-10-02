# Prodcom: run report (2026-10-02)

Classification: page-scope BUILD on a genuinely-empty project, full pipeline. Register hybrid, genre modern-minimal, variance 5, motion 2, density 7. Durable decisions, references, rejected direction and critique history live in `context.md`; this file is the run summary and validation record.

## What was built

A single prerendered landing page that works as a comparison instrument:

1. **Masthead.** Proposition, a demo-data disclosure and a three-step orientation.
2. **Ledger.** All 10 fictional products in one sortable table, with 6 decision columns: score, price for your team, rating, core-feature coverage, adoption and support, and details on demand. On phones and tablets it becomes product blocks. A team-size input re-prices everything.
3. **Selection tray.** Four numbered slots pinned to the bottom of the ledger. A fifth tick is refused, focus moves to a "which one should X replace?" choice, and "Keep these four" returns focus to the row.
4. **Head-to-head,** built only from the user's picks:
   - **0 picks:** an empty state with "Try the top three by score".
   - **1 pick:** the 3 products nearest on score, each with an Add button.
   - **2 to 4 picks:** a verdict (best overall, why, where each other pick is stronger, exclusions), a "differences only" filter, a copy-link control, and 10 grouped sections of about 45 rows. On wide screens this is a table with a sticky product header; on narrow screens it becomes attribute-first stacks with a sticky key and a section jump.
5. **Method.** The score formula, weights, eligibility rule, tie-break and data disclosure.
6. **Footer.** The disclosure again.

## Scoring model (`src/lib/score.ts`)

The score is 0 to 100, computed per team size. Weights: Capability 25, Value 25, Ease 15, User rating 15, Admin and security 10, Support 10.

- **Capability and admin:** share of the features included; a limited feature counts as half.
- **Value:** capability per dollar per person at the chosen team size, relative to the best in the whole catalogue, square-root scaled. A product's score therefore never depends on what else is selected.
- **Ease:** learning curve (gentle 90, moderate 65, steep 35).
- **Rating:** 3.0 to 5.0 mapped linearly to 0 to 100.
- **Support:** tier (basic 30, standard 55, priority 75, premium 95).
- **Exclusion:** products whose seat cap is below the team size are left out of the verdict.
- **Ties:** decided on the rounded score, then rating, then lower price, then name. The verdict states when a tie-break decided it.

The winner changes with the selection (for example, Northlane beats Mondray, while Mondray beats Plotwise) and with team size (Cairnpoint leads at 200 people). Unit tests cover this.

## Validation (production build, `npm run build` then `npm run preview`)

| Check | Result |
|---|---|
| Typecheck (`tsc --noEmit`) | pass |
| Build plus prerender | pass. 85 kB gzip JS; all content present in the HTML |
| Unit (`npm test`, node:test) | 10/10 pass: dataset size, weights, max-4 toggle, replace, URL parsing, pricing, winner change, tie-break, exclusion |
| E2E (`npx playwright test`) | 11/11 pass: 0→1→2→3→4 states, fifth refused with focus and replace, deselect from 4, winner recalculation, URL state, jump focus, differences-only, clear, team-size exclusion, keyboard-only selection with visible focus, no-JS content (10 rows), no console errors, no page overflow at 320/375/768/1024/1280/1920 including the full-tray state, a 320 px limit flow, slot names exposed to AT |
| Reflow (A11Y-010) | root `overflow-x: clip` neutralised; 0 elements past the viewport at 320, 600, 640, 900, 960 and 1040 with the full tray and all details open |
| Clickable-text wrap (INTX-003) | the one real violation (replace buttons at 320) was fixed; the remaining hits were confirmed as sr-only-span false positives |
| Contrast (A11Y-001) | computed from OKLCH tokens: text pairs 6.22 to 15.78:1, UI and focus pairs 5.54 to 7.44:1 |
| Reduced motion | `prefers-reduced-motion` block present; smooth scroll gated in JS; the only movement is the switch knob, which is removed under reduce |
| Screenshots inspected | 1440, 1024, 768, 375 and 320 with 0, 1, 3 and 4 picks, the full tray, and team size 60 (Level 2 reviewer) |

## Critique

- **Level 1:** recorded before dispatch.
- **Level 2:** an independent fresh-context reviewer with literal rubric transport. It found three major issues; all three were fixed, and every minor issue was fixed as well.
- **Disagreement:** the reviewer disagreed with Level 1 on Accessibility and Craft. This is recorded in `context.md` > Fingerprint History, together with the post-Level-2 re-run.

## Remaining risks

- **Phone replace panel.** On phones, while the "comparison is full" panel is open, it covers about half the viewport, including the row being decided. It is transient and focus sits inside the panel.
- **Desktop masthead.** At 1440×900, the masthead uses about 390 px, so only 2 ledger rows show above the tray in the first viewport.
- **Narrow-screen comparison length.** With 4 picks at 320 px the comparison is long (about 20,000 px). "Show only differences" and "Jump to" mitigate this but do not remove it.
- **Fonts.** Archivo loads from Google Fonts and blocks rendering; the system-font fallback is acceptable if it fails.
- **Browser coverage.** Only Chromium was tested; Firefox and Safari were not. Sticky `thead th` and `:has()` are supported in current versions of both.
- **Score model.** The weights are a design decision applied to demo data. The verdict copy and the Method section say so, but the "best overall" is only as meaningful as the invented data.

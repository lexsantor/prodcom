import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTS, PRODUCT_BY_ID } from '../data/products.ts'
import { AREAS, WEIGHTS, compareScored, costFor, rankPositions, scoreCatalog, verdictFor, type Scored } from './score.ts'
import { MAX_SELECTED, parseCompare, parseTeam, replace, toggle } from './selection.ts'

test('dataset has exactly 10 uniquely named products', () => {
  assert.equal(PRODUCTS.length, 10)
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, 10)
})

test('weights sum to 100', () => {
  assert.equal(AREAS.reduce((s, a) => s + WEIGHTS[a], 0), 100)
})

test('no product leads every area across the whole catalogue', () => {
  const scores = scoreCatalog(10)
  const leaders = verdictFor(PRODUCTS.map((p) => p.id).slice(0, MAX_SELECTED), scores).leaders
  const names = new Set(AREAS.flatMap((a) => leaders[a].map((s) => s.product.id)))
  assert.ok(names.size > 1)
})

test('toggle enforces the four-product maximum', () => {
  let ids: string[] = []
  for (const id of ['quillo', 'taskara', 'northlane', 'mondray']) {
    const r = toggle(ids, id)
    assert.equal(r.kind, 'added')
    ids = r.ids
  }
  const fifth = toggle(ids, 'veloxa')
  assert.equal(fifth.kind, 'full')
  assert.deepEqual(fifth.ids, ids)
  assert.equal(toggle(ids, 'taskara').kind, 'removed')
})

test('replace keeps slot order and refuses duplicates', () => {
  const ids = ['quillo', 'taskara', 'northlane']
  assert.deepEqual(replace(ids, 'taskara', 'veloxa'), ['quillo', 'veloxa', 'northlane'])
  assert.deepEqual(replace(ids, 'taskara', 'quillo'), ids)
})

test('URL parsing drops unknown ids, duplicates and extras', () => {
  assert.deepEqual(parseCompare('northlane,nope,northlane,quillo,taskara,mondray,veloxa'),
    ['northlane', 'quillo', 'taskara', 'mondray'])
  assert.equal(parseTeam('abc'), 10)
  assert.equal(parseTeam('0'), 1)
  assert.equal(parseTeam('9999'), 500)
})

test('cost follows seat minimums, flat plans and seat caps', () => {
  const north = costFor(PRODUCT_BY_ID.get('northlane')!, 1)
  assert.equal(north.total, 42) // 3-seat minimum × $14
  const taskara = costFor(PRODUCT_BY_ID.get('taskara')!, 20)
  assert.equal(taskara.total, 49 + 5 * 4)
  assert.equal(taskara.arithmetic, '$49 for 15 + 5 extra × $4')
  assert.equal(costFor(PRODUCT_BY_ID.get('quillo')!, 6).eligible, false)
})

test('winner changes with the selected set and is deterministic', () => {
  const s = scoreCatalog(10)
  assert.equal(verdictFor(['northlane', 'mondray'], s).winner?.product.id, 'northlane')
  assert.equal(verdictFor(['mondray', 'plotwise'], s).winner?.product.id, 'mondray')
  assert.equal(verdictFor(['plotwise', 'mondray'], s).winner?.product.id, 'mondray')
})

test('a score tie is broken by rating and reported', () => {
  const v = verdictFor(['taskara', 'orbitask'], scoreCatalog(10))
  assert.equal(v.winner?.product.id, 'orbitask')
  assert.equal(v.tieBreak, 'rating')
})

test('a product that cannot serve the team is excluded from the verdict', () => {
  const v = verdictFor(['quillo', 'orbitask'], scoreCatalog(10))
  assert.equal(v.winner, null)
  assert.deepEqual(v.excluded.map((s) => s.product.id), ['quillo'])
})

test('analytics payloads carry the envelope and page context, and drop unknown products', async () => {
  const { buildPayload, setTrackContext, SCHEMA_VERSION } = await import('./track.ts')
  setTrackContext({ team_size: 25, selected_ids: ['northlane', 'taskara'], winner_id: 'northlane', view: 'key' })
  const p = buildPayload({ event: 'product_cta_clicked', product_id: 'northlane', placement: 'verdict', destination_host: 'northlane.example' }, 1_000)
  assert.ok(p)
  assert.equal(p.schema_version, SCHEMA_VERSION)
  assert.equal(p.team_size, 25)
  assert.equal(p.selected_count, 2)
  assert.equal(p.winner_id, 'northlane')
  assert.equal(p.comparison_view, 'key')
  assert.match(p.page_view_id, /\w{8,}/)
  assert.equal(buildPayload({ event: 'product_selected', product_id: 'not-a-product', slot: 1, source: 'ledger' }, 2_000), null)
})

test('analytics drops an identical event repeated within the dedupe window only', async () => {
  const { buildPayload } = await import('./track.ts')
  const e = { event: 'comparison_shared', method: 'copy_link' } as const
  assert.ok(buildPayload(e, 10_000))
  assert.equal(buildPayload(e, 10_500), null)
  assert.ok(buildPayload(e, 11_000))
})

// Phase C1-A: one recommendation order (score, rating, lower price, name), products that can serve the team first.
const order = (team: number) => [...scoreCatalog(team).values()].sort(compareScored).map((s) => s.product.id)
const before = (list: string[], a: string, b: string) => list.indexOf(a) < list.indexOf(b)

test('a score tie is broken by rating everywhere it is ranked', () => {
  const s10 = scoreCatalog(10)
  assert.equal(s10.get('taskara')!.overall, s10.get('orbitask')!.overall)
  assert.ok(before(order(10), 'orbitask', 'taskara'))
  const s100 = scoreCatalog(100)
  assert.equal(s100.get('taskara')!.overall, s100.get('fernwork')!.overall)
  assert.ok(before(order(100), 'fernwork', 'taskara'))
})

test('a tie on score and rating is broken by lower price, then by name', () => {
  const base = scoreCatalog(10)
  const like = (id: string, total: number): Scored => {
    const s = base.get(id)!
    return { ...s, overall: 70, cost: { ...s.cost, total }, product: { ...s.product, rating: 4.5 } }
  }
  assert.ok(compareScored(like('mondray', 100), like('northlane', 200)) < 0, 'lower price first')
  assert.ok(compareScored(like('northlane', 100), like('mondray', 100)) > 0, 'then name: Mondray before Northlane')
})

test('products that can serve the team always rank before those that cannot, at every team size', () => {
  for (let team = 1; team <= 500; team++) {
    const ranked = [...scoreCatalog(team).values()].sort(compareScored)
    const firstOut = ranked.findIndex((s) => !s.cost.eligible)
    if (firstOut >= 0) assert.ok(ranked.slice(firstOut).every((s) => !s.cost.eligible), `team ${team}`)
    const ranks = rankPositions(scoreCatalog(team))
    ranked.forEach((s, i) => assert.equal(ranks.get(s.product.id), s.cost.eligible ? i + 1 : undefined))
  }
})

test('a product that cannot serve the team never wins, whatever its score', () => {
  const s = new Map(scoreCatalog(10))
  const quillo = s.get('quillo')!
  s.set('quillo', { ...quillo, overall: 99 })
  assert.equal(quillo.cost.eligible, false)
  assert.equal(verdictFor(['quillo', 'taskara', 'veloxa'], s).winner?.product.id, 'taskara')
})

test('crossing a seat cap moves a product out of the ranking and to the end', () => {
  assert.equal(rankPositions(scoreCatalog(5)).has('quillo'), true)
  assert.equal(rankPositions(scoreCatalog(6)).has('quillo'), false)
  assert.equal(order(6).at(-1), 'quillo')
})

test('analytics v2: clicks and selections carry sort, displayed position, rank and eligibility', async () => {
  const { buildPayload: build, setTrackContext } = await import('./track.ts')
  // the payload is a union per event; read it as plain fields
  const buildPayload = (...args: Parameters<typeof build>) => build(...args) as Record<string, unknown> | null
  setTrackContext({ team_size: 10, selected_ids: [], winner_id: null, view: null, table_sort: 'price' })
  const cta = buildPayload({ event: 'product_cta_clicked', product_id: 'orbitask', placement: 'ledger', destination_host: 'orbitask.example', display_position: 3 }, 50_000)
  assert.ok(cta)
  assert.equal(cta.schema_version, 2)
  assert.equal(cta.table_sort, 'price')
  assert.equal(cta.display_position, 3)
  assert.equal(cta.rank_position, order(10).indexOf('orbitask') + 1)
  assert.equal(cta.eligible, true)
  const out = buildPayload({ event: 'product_cta_clicked', product_id: 'quillo', placement: 'stack', destination_host: 'quillo.example' }, 51_000)
  assert.ok(out)
  assert.equal(out.display_position, null)
  assert.equal(out.rank_position, null)
  assert.equal(out.eligible, false)
  const sel = buildPayload({ event: 'product_selected', product_id: 'northlane', slot: 1, source: 'suggestion' }, 52_000)
  assert.ok(sel)
  assert.equal(sel.rank_position, 1)
  assert.equal(sel.display_position, null)
  assert.equal('eligible' in sel, false)
  assert.equal(JSON.stringify([cta, out, sel]).includes('@'), false)
})

test('comparison entry: once per set of 2+ picks, shared by every trigger', async () => {
  const { startComparison } = await import('./track.ts')
  assert.equal(startComparison(['northlane'], 'tray'), false, 'one pick is not a comparison')
  assert.equal(startComparison(['taskara', 'orbitask'], 'tray'), true)
  assert.equal(startComparison(['orbitask', 'taskara'], 'scroll'), false, 'same set, other trigger and order')
  assert.equal(startComparison(['taskara', 'orbitask'], 'link'), false)
  assert.equal(startComparison(['taskara', 'orbitask', 'veloxa'], 'scroll'), true, 'a new set is a new comparison')
})

// UX-1 / UX-2: how certain the winner is, and where its score comes from.
const fake = (base: Scored, overall: number, rating = base.product.rating, total = base.cost.total): Scored =>
  ({ ...base, overall, product: { ...base.product, rating }, cost: { ...base.cost, total } })
const setOf = (...list: Scored[]) => new Map(list.map((s) => [s.product.id, s]))

test('margin: 0 is a tie, 1 and 2 a narrow lead, 3 or more a lead', async () => {
  const { marginOf } = await import('./score.ts')
  const s = scoreCatalog(10), a = s.get('northlane')!, b = s.get('mondray')!
  const kinds = [0, 1, 2, 3, 9].map((gap) => {
    const m = marginOf(verdictFor(['northlane', 'mondray'], setOf(fake(a, 70 + gap, 4.9), fake(b, 70, 4.1))))!
    return [m.kind, m.gap]
  })
  assert.deepEqual(kinds, [['tie', 0], ['narrow', 1], ['narrow', 2], ['lead', 3], ['lead', 9]])
  assert.equal(marginOf(verdictFor(['northlane'], s)), null, 'no verdict, no margin')
})

test('margin: every pick on the winning score is tied, every pick within 2 points is close', async () => {
  const { marginOf } = await import('./score.ts')
  const tie3 = marginOf(verdictFor(['fernwork', 'taskara', 'cairnpoint'], scoreCatalog(31)))!
  assert.equal(tie3.kind, 'tie')
  assert.deepEqual(tie3.tied.map((x) => x.product.id), ['taskara', 'cairnpoint'])
  const s = scoreCatalog(10)
  const set = setOf(fake(s.get('northlane')!, 70), fake(s.get('mondray')!, 69), fake(s.get('taskara')!, 68), fake(s.get('fernwork')!, 60))
  const m = marginOf(verdictFor(['northlane', 'mondray', 'taskara', 'fernwork'], set))!
  assert.equal(m.kind, 'narrow')
  assert.deepEqual(m.close.map((x) => x.product.id), ['mondray', 'taskara'])
  assert.deepEqual(m.tied, [])
})

test('margin: a pick that cannot serve the team is never a contender', async () => {
  const { marginOf } = await import('./score.ts')
  const m = marginOf(verdictFor(['quillo', 'northlane', 'mondray'], scoreCatalog(10)))!
  assert.equal(m.runnerUp.product.id, 'mondray')
  assert.ok(![...m.tied, ...m.close, ...m.next].some((x) => x.product.id === 'quillo'))
})

test('ties are explained by the rule that broke them: rating, price, name, and never as a lead', async () => {
  const { marginOf } = await import('./score.ts')
  const { whyLine } = await import('./certainty.ts')
  const s = scoreCatalog(10), a = s.get('northlane')!, b = s.get('mondray')!
  const why = (x: Scored, y: Scored) => { const v = verdictFor(['northlane', 'mondray'], setOf(x, y)); return { v, text: whyLine(v, marginOf(v)!) } }
  const byPrice = why(fake(a, 70, 4.5, 90), fake(b, 70, 4.5, 140))
  assert.equal(byPrice.v.tieBreak, 'price')
  assert.match(byPrice.text, /Northlane and Mondray both score 70\./)
  assert.match(byPrice.text, /costs less for your team \(\$90 against \$140 a month\)/)
  const byName = why(fake(a, 70, 4.5, 90), fake(b, 70, 4.5, 90))
  assert.equal(byName.v.tieBreak, 'name')
  assert.match(byName.text, /comes first in name order/)
  const real = verdictFor(['fernwork', 'taskara', 'cairnpoint'], scoreCatalog(31))
  const three = whyLine(real, marginOf(real)!)
  assert.match(three, /^Fernwork, Taskara and Cairnpoint all score 68\./)
  assert.match(three, /Fernwork is rated 4\.6, against 4\.2 for Taskara and 3\.9 for Cairnpoint/)
  for (const t of [byPrice.text, byName.text, three]) assert.doesNotMatch(t, /ahead|lead/i)
})

test('a tie on the rounded score is a tie, even where the unrounded scores differ either way', async () => {
  const { marginOf, unroundedScore } = await import('./score.ts')
  const v = verdictFor(['taskara', 'orbitask'], scoreCatalog(10))
  assert.notEqual(unroundedScore(v.winner!), unroundedScore(v.ranked[1]))
  assert.equal(marginOf(v)!.kind, 'tie')
  // somewhere the unrounded score favours the runner-up; the rounded tie and the rating rule still decide
  let found = false
  for (let t = 1; t <= 500 && !found; t++) {
    const sc = scoreCatalog(t)
    for (const x of PRODUCTS) for (const y of PRODUCTS) {
      if (found || x.id >= y.id) continue
      const w = verdictFor([x.id, y.id], sc)
      if (w.winner && w.tieBreak && unroundedScore(w.ranked[1]) > unroundedScore(w.winner)) {
        found = true
        assert.equal(marginOf(w)!.kind, 'tie')
        assert.ok(w.winner.product.rating > w.ranked[1].product.rating)
      }
    }
  }
  assert.ok(found)
})

test('narrow and clear leads state the displayed gap and claim no more certainty', async () => {
  const { marginOf } = await import('./score.ts')
  const { whyLine } = await import('./certainty.ts')
  const s = scoreCatalog(10)
  const narrow = verdictFor(['northlane', 'mondray'], s)
  assert.equal(whyLine(narrow, marginOf(narrow)!), 'It scores 74, 2 points ahead of Mondray: a narrow lead, so what matters most to your team can change the choice.')
  const lead = verdictFor(['northlane', 'taskara'], s)
  assert.equal(whyLine(lead, marginOf(lead)!), 'It scores 74, 6 points ahead of Taskara.')
  const set = setOf(fake(s.get('northlane')!, 70), fake(s.get('mondray')!, 69), fake(s.get('taskara')!, 68))
  const two = verdictFor(['northlane', 'mondray', 'taskara'], set)
  assert.match(whyLine(two, marginOf(two)!), /^It scores 70, 1 point ahead of Mondray and 2 ahead of Taskara: a narrow lead/)
  const level = setOf(fake(s.get('northlane')!, 74), fake(s.get('mondray')!, 70), fake(s.get('fernwork')!, 70))
  const tiedNext = verdictFor(['northlane', 'mondray', 'fernwork'], level)
  // listed in recommendation order: Fernwork (4.6) before Mondray (4.1) on the same score
  assert.equal(whyLine(tiedNext, marginOf(tiedNext)!), 'It scores 74, 4 points ahead of Fernwork and Mondray, which both score 70.')
  for (const v of [narrow, lead, tiedNext]) assert.doesNotMatch(whyLine(v, marginOf(v)!), /significant|decisive|certain|robust/i)
})

test('area contributions come from the score itself and add up to the unrounded difference', async () => {
  const { contributions, unroundedScore } = await import('./score.ts')
  for (const t of [1, 6, 10, 31, 100, 500]) {
    const sc = scoreCatalog(t)
    for (const s of sc.values()) assert.equal(s.overall, Math.round(unroundedScore(s)), 'the shown score is the rounded weighted sum')
    for (const x of sc.values()) for (const y of sc.values()) {
      const sum = contributions(x, y).reduce((acc, c) => acc + c.points, 0)
      assert.ok(Math.abs(sum - (unroundedScore(x) - unroundedScore(y))) < 1e-9)
    }
  }
  const s = scoreCatalog(10)
  const byArea = Object.fromEntries(contributions(s.get('northlane')!, s.get('mondray')!).map((c) => [c.area, Number(c.points.toFixed(1))]))
  assert.deepEqual(byArea, { capability: -3.3, value: 4.6, ease: 4.5, rating: 3, admin: -2.5, support: -4 })
})

test('the breakdown rounds to one decimal, sorts by size and never shows a signed zero', async () => {
  const { breakdown } = await import('./score.ts')
  const s = scoreCatalog(10), n = s.get('northlane')!
  const b = breakdown(n, s.get('mondray')!)
  assert.deepEqual(b.forA, [{ area: 'value', points: 4.6 }, { area: 'ease', points: 4.5 }, { area: 'rating', points: 3 }])
  assert.deepEqual(b.forB, [{ area: 'support', points: 4 }, { area: 'capability', points: 3.3 }, { area: 'admin', points: 2.5 }])
  assert.deepEqual(b.even, [])
  const same = breakdown(n, n)
  assert.deepEqual([same.forA, same.forB, same.even.length], [[], [], 6])
  // a difference below 0.05 points rounds to nothing: even, not +0.0 or -0.0
  const nudged: Scored = { ...n, areas: { ...n.areas, rating: n.areas.rating - 0.2 } } // 0.2 × 15% = 0.03 points
  assert.deepEqual(breakdown(n, nudged), { forA: [], forB: [], even: ['capability', 'value', 'ease', 'rating', 'admin', 'support'] })
  for (const c of [...b.forA, ...b.forB]) assert.ok(c.points > 0 && !Object.is(c.points, -0))
})

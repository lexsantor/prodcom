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

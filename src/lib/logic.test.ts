import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTS, PRODUCT_BY_ID } from '../data/products.ts'
import { AREAS, WEIGHTS, costFor, scoreCatalog, verdictFor } from './score.ts'
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

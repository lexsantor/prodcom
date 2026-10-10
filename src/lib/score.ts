import {
  ADMIN_FEATURES, CORE_FEATURES, PRODUCTS,
  type Avail, type Curve, type Level, type Product, type SupportTier,
} from '../data/products.ts'

/** Weights of the Prodcom score. They sum to 100 and are shown on the page. */
export const WEIGHTS = { capability: 25, value: 25, ease: 15, rating: 15, admin: 10, support: 10 } as const
export type Area = keyof typeof WEIGHTS
export const AREAS = Object.keys(WEIGHTS) as Area[]

export const AREA_LABEL: Record<Area, string> = {
  capability: 'Capability',
  value: 'Value for your team',
  ease: 'Ease of adoption',
  rating: 'User rating',
  admin: 'Admin and security',
  support: 'Support',
}

export const CURVE_SCORE: Record<Curve, number> = { gentle: 90, moderate: 65, steep: 35 }
export const SUPPORT_SCORE: Record<SupportTier, number> = { basic: 30, standard: 55, priority: 75, premium: 95 }

export const TEAM_MIN = 1
export const TEAM_MAX = 500
export const TEAM_DEFAULT = 10

export const level = (a: Avail): Level => (typeof a === 'number' ? a : a[0])
export const note = (a: Avail): string | undefined => (typeof a === 'number' ? undefined : a[1])

export interface Cost {
  eligible: boolean
  /** why the product cannot serve this team size */
  reason?: string
  /** monthly cost for the whole team, billed yearly */
  total: number
  /** monthly cost for the whole team, billed monthly */
  totalMonthlyBilling: number
  /** the visible arithmetic behind `total` */
  arithmetic: string
}

const usd = (n: number) => `$${n.toLocaleString('en-US')}`

export function costFor(p: Product, team: number): Cost {
  const pr = p.pricing
  const eligible = pr.maxSeats === undefined || team <= pr.maxSeats
  const reason = eligible ? undefined : `Supports at most ${pr.maxSeats} seats`

  if (pr.model === 'flat') {
    const extra = Math.max(0, team - (pr.includedSeats ?? 0))
    const [extraAnnual, extraMonthly] = pr.extraSeat ?? [0, 0]
    return {
      eligible,
      reason,
      total: pr.annual + extra * extraAnnual,
      totalMonthlyBilling: pr.monthly + extra * extraMonthly,
      arithmetic: extra > 0
        ? `${usd(pr.annual)} for ${pr.includedSeats} + ${extra} extra × ${usd(extraAnnual)}`
        : `Flat ${usd(pr.annual)} for up to ${pr.includedSeats} people`,
    }
  }

  const billed = Math.max(team, pr.minSeats ?? 1)
  return {
    eligible,
    reason,
    total: billed * pr.annual,
    totalMonthlyBilling: billed * pr.monthly,
    arithmetic: billed > team
      ? `${billed} × ${usd(pr.annual)} (${pr.minSeats}-seat minimum)`
      : `${billed} × ${usd(pr.annual)} per seat`,
  }
}

export interface Coverage { full: number; limited: number; total: number }

function coverageOf(values: Avail[]): Coverage {
  const levels = values.map(level)
  return {
    full: levels.filter((l) => l === 2).length,
    limited: levels.filter((l) => l === 1).length,
    total: levels.length,
  }
}

export const coreCoverage = (p: Product) => coverageOf(CORE_FEATURES.map((f) => p.core[f.id]))
export const adminCoverage = (p: Product) => coverageOf(ADMIN_FEATURES.map((f) => p.admin[f.id]))

/** included = 1 point, limited = half a point, as a share of the maximum */
const coveragePct = (c: Coverage) => ((c.full + c.limited / 2) / c.total) * 100

/** Capability per dollar per person; the basis of the value score. */
function valueRatio(p: Product, team: number): number {
  const cost = costFor(p, team)
  return cost.eligible ? coveragePct(coreCoverage(p)) / (cost.total / team) : 0
}

export interface Scored {
  product: Product
  cost: Cost
  areas: Record<Area, number>
  /** 0 to 100, rounded; the number shown and compared */
  overall: number
}

/** An area's share of the overall score, in points out of 100. */
const weighted = (areas: Record<Area, number>, a: Area) => (areas[a] * WEIGHTS[a]) / 100
const weightedSum = (areas: Record<Area, number>) => AREAS.reduce((sum, a) => sum + weighted(areas, a), 0)

/** The score before rounding; `overall` is this rounded, and only `overall` is shown and ranked. */
export const unroundedScore = (s: Scored) => weightedSum(s.areas)

/**
 * Scores every product for one team size. Value is measured against the best
 * capability-per-dollar in the whole catalogue (not just the selection), so a
 * product's score never depends on what else the user picked.
 */
export function scoreCatalog(team: number): Map<string, Scored> {
  const best = Math.max(...PRODUCTS.map((p) => valueRatio(p, team)))
  return new Map(PRODUCTS.map((p) => {
    const areas: Record<Area, number> = {
      capability: coveragePct(coreCoverage(p)),
      value: best > 0 ? 100 * Math.sqrt(valueRatio(p, team) / best) : 0,
      ease: CURVE_SCORE[p.onboarding.curve],
      rating: Math.min(100, Math.max(0, ((p.rating - 3) / 2) * 100)),
      admin: coveragePct(adminCoverage(p)),
      support: SUPPORT_SCORE[p.support.tier],
    }
    const overall = Math.round(weightedSum(areas))
    return [p.id, { product: p, cost: costFor(p, team), areas, overall }]
  }))
}

export type TieBreak = 'rating' | 'price' | 'name'

/**
 * The recommendation order, used by every surface that ranks: products that can serve the team first,
 * then score (only between products that can serve the team; the others are not scored), then rating,
 * then lower price, then name. Names are unique, so the order is total.
 */
export function compareScored(a: Scored, b: Scored): number {
  const bothEligible = a.cost.eligible && b.cost.eligible
  return Number(b.cost.eligible) - Number(a.cost.eligible)
    || (bothEligible ? b.overall - a.overall : 0)
    || b.product.rating - a.product.rating
    || a.cost.total - b.cost.total
    || a.product.name.localeCompare(b.product.name, 'en')
}

/** 1-based position of each product that can serve the team in the recommendation order; absent = not ranked. */
export function rankPositions(scores: Map<string, Scored>): Map<string, number> {
  const ranked = [...scores.values()].filter((s) => s.cost.eligible).sort(compareScored)
  return new Map(ranked.map((s, i) => [s.product.id, i + 1]))
}

export interface Verdict {
  /** eligible products, best first */
  ranked: Scored[]
  /** selected products that cannot serve the team size */
  excluded: Scored[]
  winner: Scored | null
  /** set when the winner ties the runner-up on score */
  tieBreak: TieBreak | null
  /** the selected products that lead each area (several when tied) */
  leaders: Record<Area, Scored[]>
}

export function verdictFor(ids: readonly string[], scores: Map<string, Scored>): Verdict {
  const picked = ids.map((id) => scores.get(id)).filter((s): s is Scored => s !== undefined)
  const ranked = picked.filter((s) => s.cost.eligible).sort(compareScored)
  const excluded = picked.filter((s) => !s.cost.eligible)
  const [first, second] = ranked
  const winner = ranked.length >= 2 ? first : null

  const tieBreak = winner && second && winner.overall === second.overall ? tieBreakBetween(winner, second) : null

  const leaders = Object.fromEntries(AREAS.map((a) => {
    const top = Math.max(...ranked.map((s) => Math.round(s.areas[a])))
    const lead = ranked.filter((s) => Math.round(s.areas[a]) === top)
    // an area where everyone ties has no leader
    return [a, lead.length === ranked.length ? [] : lead]
  })) as Record<Area, Scored[]>

  return { ranked, excluded, winner, tieBreak, leaders }
}

/** Which step of the recommendation order separates two products on the same score. */
export function tieBreakBetween(a: Scored, b: Scored): TieBreak {
  return a.product.rating !== b.product.rating ? 'rating' : a.cost.total !== b.cost.total ? 'price' : 'name'
}

/**
 * The largest gap, in displayed points, still called a narrow lead. Scores are rounded, so a displayed gap of g is an
 * unrounded gap between g - 1 and g + 1: at 2 or less it can be smaller than what one core feature adds through
 * capability alone (25% of 1/15, about 1.7 points); from 3 it is always above 2. A labelling convention, not a test of
 * significance: it never changes the ranking.
 */
export const NARROW_MAX = 2

export interface Margin {
  kind: 'tie' | 'narrow' | 'lead'
  /** the winner's displayed score minus the runner-up's */
  gap: number
  runnerUp: Scored
  /** other picks on the winner's score, in recommendation order */
  tied: Scored[]
  /** other picks 1 to NARROW_MAX points behind the winner */
  close: Scored[]
  /** picks sharing the runner-up's score, the runner-up included */
  next: Scored[]
}

/** How far the winner is ahead, among the picks that can serve the team; null without a verdict. */
export function marginOf(v: Verdict): Margin | null {
  const [winner, runnerUp, ...rest] = v.ranked
  if (!v.winner || !runnerUp) return null
  const others = [runnerUp, ...rest]
  const gap = winner.overall - runnerUp.overall
  return {
    kind: gap === 0 ? 'tie' : gap <= NARROW_MAX ? 'narrow' : 'lead',
    gap,
    runnerUp,
    tied: others.filter((s) => s.overall === winner.overall),
    close: others.filter((s) => winner.overall - s.overall >= 1 && winner.overall - s.overall <= NARROW_MAX),
    next: others.filter((s) => s.overall === runnerUp.overall),
  }
}

/** What each area adds to `a`'s unrounded score over `b`'s, in points; positive favours `a`. Sums to the unrounded gap. */
export function contributions(a: Scored, b: Scored): { area: Area; points: number }[] {
  return AREAS.map((area) => ({ area, points: weighted(a.areas, area) - weighted(b.areas, area) }))
}

export interface Breakdown {
  /** areas where `a` gains, largest first; points are positive and rounded to 0.1 */
  forA: { area: Area; points: number }[]
  forB: { area: Area; points: number }[]
  /** areas whose difference rounds to 0.0 */
  even: Area[]
}

/** Contributions as shown: one decimal, split by who gains. Rounding the magnitude means no -0 can appear. */
export function breakdown(a: Scored, b: Scored): Breakdown {
  const shown = contributions(a, b).map((c) => ({ area: c.area, sign: Math.sign(c.points), points: Math.round(Math.abs(c.points) * 10) / 10 }))
  const side = (sign: number) => shown
    .filter((c) => c.points > 0 && c.sign === sign)
    .sort((x, y) => y.points - x.points)
    .map(({ area, points }) => ({ area, points }))
  return { forA: side(1), forB: side(-1), even: shown.filter((c) => c.points === 0).map((c) => c.area) }
}

/** The best `count` products that can serve the team, leaving out `exclude`. */
export function topEligible(scores: Map<string, Scored>, count: number, exclude: readonly string[] = []): Scored[] {
  return [...scores.values()]
    .filter((s) => s.cost.eligible && !exclude.includes(s.product.id))
    .sort(compareScored)
    .slice(0, count)
}

/** Products nearest in score to `id`, for the one-selected state. */
export function nearestBy(id: string, scores: Map<string, Scored>, count: number): Scored[] {
  const self = scores.get(id)
  if (!self) return []
  return [...scores.values()]
    .filter((s) => s.product.id !== id && s.cost.eligible)
    .sort((a, b) => Math.abs(a.overall - self.overall) - Math.abs(b.overall - self.overall) || compareScored(a, b))
    .slice(0, count)
}

export { usd }

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
    const overall = Math.round(AREAS.reduce((sum, a) => sum + (areas[a] * WEIGHTS[a]) / 100, 0))
    return [p.id, { product: p, cost: costFor(p, team), areas, overall }]
  }))
}

export type TieBreak = 'rating' | 'price' | 'name'

/** Ranking order: score, then rating, then lower price, then name. */
export function compareScored(a: Scored, b: Scored): number {
  return b.overall - a.overall
    || b.product.rating - a.product.rating
    || a.cost.total - b.cost.total
    || a.product.name.localeCompare(b.product.name)
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

  let tieBreak: TieBreak | null = null
  if (winner && second && winner.overall === second.overall) {
    tieBreak = winner.product.rating !== second.product.rating ? 'rating'
      : winner.cost.total !== second.cost.total ? 'price' : 'name'
  }

  const leaders = Object.fromEntries(AREAS.map((a) => {
    const top = Math.max(...ranked.map((s) => Math.round(s.areas[a])))
    const lead = ranked.filter((s) => Math.round(s.areas[a]) === top)
    // an area where everyone ties has no leader
    return [a, lead.length === ranked.length ? [] : lead]
  })) as Record<Area, Scored[]>

  return { ranked, excluded, winner, tieBreak, leaders }
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

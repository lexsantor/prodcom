import { ADMIN_FEATURES, CORE_FEATURES, type Avail as AvailValue } from '../data/products.ts'
import { AREAS, AREA_LABEL, WEIGHTS, level, usd, type Scored } from '../lib/score.ts'
import { Avail, availText } from './Avail.tsx'

export interface Row {
  key: string
  label: string
  hint?: string
  render: (s: Scored) => React.ReactNode
  /** plain text, used to detect rows that are identical across the selection */
  text: (s: Scored) => string
  /** ordinal rank, higher is better; absent when the attribute has no better or worse */
  rank?: (s: Scored) => number
  /** tag for the best value in the row ("Lowest"), shown only on rows that set one */
  tag?: string
  /** summarises other rows (score areas): flagged, but not counted in the "behind" view */
  derived?: boolean
}

export interface Group {
  key: string
  title: string
  rows: Row[]
  /** feature availability per product, for the group's "most complete" line */
  features?: (s: Scored) => AvailValue[]
}

const CURVE = { gentle: 'Gentle', moderate: 'Moderate', steep: 'Steep' } as const

const plain = (key: string, label: string, get: (s: Scored) => string, rank?: (s: Scored) => number): Row => ({
  key, label, render: (s) => get(s), text: get, rank,
})

const feature = (key: string, label: string, get: (s: Scored) => AvailValue): Row => ({
  key, label, render: (s) => <Avail value={get(s)} />, text: (s) => availText(get(s)), rank: (s) => level(get(s)),
})

const CURVE_RANK = { gentle: 3, moderate: 2, steep: 1 } as const

const list = (items: readonly string[]) => <ul className="cell-list">{items.map((t) => <li key={t}>{t}</li>)}</ul>

function coreRows(group: string): Row[] {
  return CORE_FEATURES.filter((f) => f.group === group).map((f) => feature(f.id, f.label, (s) => s.product.core[f.id]))
}

function coreValues(group: string) {
  return (s: Scored) => CORE_FEATURES.filter((f) => f.group === group).map((f) => s.product.core[f.id])
}

export function buildGroups(team: number): Group[] {
  return [
    {
      key: 'price',
      title: 'Price and plans',
      rows: [
        {
          key: 'cost',
          label: `Monthly cost for ${team}`,
          hint: 'billed yearly',
          render: (s) => s.cost.eligible
            ? <><strong className="num">{usd(s.cost.total)}</strong><span className="muted"> /mo</span><span className="cell-sub">{s.cost.arithmetic}</span></>
            : <><span className="warn">Not available for {team}</span><span className="cell-sub">{s.cost.reason}</span></>,
          text: (s) => (s.cost.eligible ? String(s.cost.total) : 'n/a'),
          rank: (s) => -s.cost.total,
          tag: 'Lowest',
        },
        {
          key: 'monthly',
          label: 'If billed monthly',
          render: (s) => s.cost.eligible ? <><span className="num">{usd(s.cost.totalMonthlyBilling)}</span><span className="muted"> /mo</span></> : <span className="muted">Not available</span>,
          text: (s) => (s.cost.eligible ? String(s.cost.totalMonthlyBilling) : 'n/a'),
          rank: (s) => -s.cost.totalMonthlyBilling,
          tag: 'Lowest',
        },
        plain('free', 'Free plan', (s) => s.product.pricing.freePlan ?? 'None', (s) => (s.product.pricing.freePlan ? 1 : 0)),
        plain('trial', 'Free trial', (s) => (s.product.pricing.trialDays ? `${s.product.pricing.trialDays} days` : 'None'), (s) => s.product.pricing.trialDays ?? 0),
        plain('seats', 'Seat limits', (s) => {
          const { minSeats, maxSeats } = s.product.pricing
          if (maxSeats) return `At most ${maxSeats} seats`
          if (minSeats) return `At least ${minSeats} seats billed`
          return 'No limit'
        }, (s) => (s.product.pricing.minSeats || s.product.pricing.maxSeats ? 0 : 1)),
        plain('storage', 'Storage', (s) => s.product.storage),
      ],
    },
    {
      key: 'score',
      title: 'Prodcom score',
      rows: [
        {
          key: 'overall',
          label: 'Overall',
          hint: 'out of 100',
          render: (s) => <strong className="num big">{s.overall}</strong>,
          text: (s) => String(s.overall),
          rank: (s) => s.overall,
          tag: 'Highest',
        },
        ...AREAS.map((a): Row => ({
          key: `area-${a}`,
          label: AREA_LABEL[a],
          hint: `${WEIGHTS[a]}% of the score`,
          render: (s) => <ScoreBar value={s.areas[a]} />,
          text: (s) => String(Math.round(s.areas[a])),
          rank: (s) => Math.round(s.areas[a]),
          tag: 'Leads',
          derived: true,
        })),
      ],
    },
    {
      key: 'fit',
      title: 'Fit and reputation',
      rows: [
        plain('bestFor', 'Best for', (s) => s.product.bestFor),
        {
          key: 'rating',
          label: 'User rating',
          hint: 'demo reviews',
          render: (s) => <><strong className="num">{s.product.rating.toFixed(1)}</strong><span className="muted"> / 5</span><span className="cell-sub">{s.product.reviews.toLocaleString('en-US')} reviews</span></>,
          text: (s) => `${s.product.rating}`,
          rank: (s) => s.product.rating,
          tag: 'Highest',
        },
        { key: 'strengths', label: 'Strengths', render: (s) => list(s.product.strengths), text: (s) => s.product.strengths.join() },
        { key: 'limitations', label: 'Limitations', render: (s) => list(s.product.limitations), text: (s) => s.product.limitations.join() },
      ],
    },
    { key: 'planning', title: 'Planning and views', rows: coreRows('planning'), features: coreValues('planning') },
    { key: 'collaboration', title: 'Collaboration', rows: coreRows('collaboration'), features: coreValues('collaboration') },
    {
      key: 'automation',
      title: 'Automation and integrations',
      features: coreValues('automation'),
      rows: [
        ...coreRows('automation'),
        {
          key: 'integrations',
          label: 'Native integrations',
          render: (s) => <span className="num">{s.product.integrations}</span>,
          text: (s) => String(s.product.integrations),
          rank: (s) => s.product.integrations,
          tag: 'Most',
        },
      ],
    },
    { key: 'reporting', title: 'Reporting', rows: coreRows('reporting'), features: coreValues('reporting') },
    {
      key: 'admin',
      title: 'Admin and security',
      rows: ADMIN_FEATURES.map((f) => feature(f.id, f.label, (s) => s.product.admin[f.id])),
      features: (s) => ADMIN_FEATURES.map((f) => s.product.admin[f.id]),
    },
    {
      key: 'support',
      title: 'Support and onboarding',
      rows: [
        plain('channels', 'Support channels', (s) => s.product.support.channels),
        plain('response', 'First response', (s) => s.product.support.response, (s) => -s.product.support.responseHours),
        plain('sla', 'Uptime commitment', (s) => s.product.support.sla ?? 'None published', (s) => parseFloat(s.product.support.sla ?? '0')),
        plain('curve', 'Learning curve', (s) => CURVE[s.product.onboarding.curve], (s) => CURVE_RANK[s.product.onboarding.curve]),
        plain('setup', 'Typical setup', (s) => s.product.onboarding.setup, (s) => -s.product.onboarding.setupDays),
        {
          key: 'templates',
          label: 'Templates',
          render: (s) => <span className="num">{s.product.onboarding.templates}</span>,
          text: (s) => String(s.product.onboarding.templates),
          rank: (s) => s.product.onboarding.templates,
          tag: 'Most',
        },
        feature('migration', 'Migration help', (s) => s.product.migration),
      ],
    },
    {
      key: 'platforms',
      title: 'Platforms',
      rows: [
        feature('web', 'Web app', () => 2),
        plain('desktop', 'Desktop apps', (s) => s.product.platforms.desktop ?? 'None', (s) => (s.product.platforms.desktop ? s.product.platforms.desktop.split(',').length : 0)),
        plain('mobile', 'Mobile apps', (s) => s.product.platforms.mobile, (s) => (s.product.platforms.mobile.includes('view only') ? 0.5 : s.product.platforms.mobile.split(',').length)),
        feature('offline', 'Offline use', (s) => s.product.platforms.offline),
      ],
    },
  ]
}

function ScoreBar({ value }: { value: number }) {
  const v = Math.round(value)
  return (
    <span className="scorebar">
      <span className="num">{v}</span>
      <span className="scorebar-track" aria-hidden="true"><span className="scorebar-fill" style={{ width: `${v}%` }} /></span>
    </span>
  )
}

/** Ids of the products holding the best value in a row; empty when all are equal. */
export function bestIn(row: Row, picked: Scored[]): Set<string> {
  const { rank, tag } = row
  if (!rank || !tag) return new Set()
  const eligible = picked.filter((s) => s.cost.eligible)
  if (eligible.length < 2) return new Set()
  const target = Math.max(...eligible.map(rank))
  const winners = eligible.filter((s) => rank(s) === target)
  return winners.length === eligible.length ? new Set() : new Set(winners.map((s) => s.product.id))
}

export const isIdentical = (row: Row, picked: Scored[]) => new Set(picked.map(row.text)).size === 1

/** "Most complete here" line for feature groups. */
export function groupLeader(group: Group, picked: Scored[]): string | null {
  if (!group.features || picked.length < 2) return null
  const counts = picked.map((s) => ({ s, full: group.features!(s).filter((a) => level(a) === 2).length }))
  const total = group.features(picked[0]).length
  const top = Math.max(...counts.map((c) => c.full))
  const leaders = counts.filter((c) => c.full === top)
  if (leaders.length === counts.length) return `All your picks include ${top} of ${total} here`
  const names = leaders.map((c) => c.s.product.name)
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return `Most complete: ${who}, ${top} of ${total} included`
}

/** Where the winner stands on one row. Only eligible picks are compared. */
export type RowStatus = 'behind' | 'ahead' | 'differs' | 'same'

export function statusOf(row: Row, picked: Scored[], winnerId?: string): RowStatus {
  if (isIdentical(row, picked)) return 'same'
  const winner = picked.find((s) => s.product.id === winnerId)
  if (!winner || !row.rank) return 'differs'
  const others = picked.filter((s) => s.cost.eligible && s !== winner).map(row.rank)
  const w = row.rank(winner)
  if (others.some((r) => r > w)) return 'behind'
  if (others.some((r) => r < w)) return 'ahead'
  return 'differs'
}

/** The picks that beat the winner on a row (best rank among the others). */
export function aheadOfWinner(row: Row, picked: Scored[], winner: Scored): Scored[] {
  if (!row.rank) return []
  const w = row.rank(winner)
  const others = picked.filter((s) => s.cost.eligible && s !== winner && row.rank!(s) > w)
  const top = Math.max(...others.map(row.rank))
  return others.filter((s) => row.rank!(s) === top)
}

/** "Northlane: ahead on 3, behind on 1, 2 the same" for a group header. */
export function groupStanding(group: Group, picked: Scored[], winner?: Scored): string | null {
  if (!winner) return groupLeader(group, picked)
  const counts = { ahead: 0, behind: 0, same: 0, differs: 0 }
  for (const r of group.rows) counts[statusOf(r, picked, winner.product.id)]++
  const parts = [
    counts.ahead && `ahead on ${counts.ahead}`,
    counts.behind && `behind on ${counts.behind}`,
    counts.differs && `${counts.differs} other ${counts.differs === 1 ? 'difference' : 'differences'}`,
    counts.same && `${counts.same} the same for all`,
  ].filter(Boolean)
  return `${winner.product.name}: ${parts.join(', ')}`
}

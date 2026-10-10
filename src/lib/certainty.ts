import { tieBreakBetween, usd, type Margin, type Scored, type Verdict } from './score.ts'

/** How sure the verdict can be, said once per surface: header label, verdict, caption, announcement. */

export const join = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

const nameList = (list: Scored[]) => join(list.map((s) => s.product.name))
const pts = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`

/** The verdict's first sentence: the displayed gap, or for a tie the rule that broke it. */
export function whyLine(v: Verdict, m: Margin): string {
  const w = v.winner!
  if (m.kind === 'tie') return tieLine(w, m.tied)
  if (m.kind === 'narrow') {
    const gaps = [...new Set(m.close.map((s) => w.overall - s.overall))]
    const parts = gaps.map((g, i) => `${i === 0 ? pts(g) : g} ahead of ${nameList(m.close.filter((s) => w.overall - s.overall === g))}`)
    return `It scores ${w.overall}, ${join(parts)}: a narrow lead, so what matters most to your team can change the choice.`
  }
  const level = m.next.length > 1 ? `, which ${m.next.length === 2 ? 'both' : 'all'} score ${m.runnerUp.overall}` : ''
  return `It scores ${w.overall}, ${pts(m.gap)} ahead of ${nameList(m.next)}${level}.`
}

function tieLine(w: Scored, tied: Scored[]): string {
  const all = [w, ...tied]
  const head = `${nameList(all)} ${all.length === 2 ? 'both' : 'all'} score ${w.overall}.`
  const byRating = tied.filter((s) => tieBreakBetween(w, s) === 'rating')
  const clauses: string[] = []
  if (byRating.length) {
    clauses.push(`is rated ${w.product.rating.toFixed(1)}, against ${join(byRating.map((s) => `${s.product.rating.toFixed(1)} for ${s.product.name}`))}`)
  }
  for (const s of tied.filter((x) => tieBreakBetween(w, x) !== 'rating')) {
    clauses.push(tieBreakBetween(w, s) === 'price'
      ? `matches ${s.product.name}'s rating and costs less for your team (${usd(w.cost.total)} against ${usd(s.cost.total)} a month)`
      : `matches ${s.product.name} on rating and price and comes first in name order`)
  }
  const reasons = clauses.map((c, i) => `${i === 0 ? w.product.name : 'it'} ${c}`).join('; ')
  return `${head} Ties go to the higher user rating, then the lower price, then name order: ${reasons}.`
}

/** The line above the winner's name. */
export function kicker(v: Verdict, m: Margin, team: number): string {
  const n = v.ranked.length
  const among = v.excluded.length > 0 ? `${n} picks that can serve a team of ${team}` : `${n}, for a team of ${team}`
  if (m.kind === 'tie') return `Best overall, tied on score: first on the tie-break among your ${among}`
  const label = m.kind === 'narrow' ? 'Best overall, narrow lead' : 'Best overall'
  return `${label}: the highest Prodcom score of your ${among}`
}

/** Second line under the winner's "Best overall" label; none for a clear lead. */
export function winnerQualifier(m: Margin | null): string | null {
  if (!m || m.kind === 'lead') return null
  return m.kind === 'tie' ? 'Tied on score' : `Narrow lead by ${pts(m.gap)}`
}

/** Label for another pick that is level with, or within the narrow band of, the winner. */
export function contenderTag(m: Margin | null, s: Scored, winner: Scored): string | null {
  if (!m) return null
  if (m.tied.includes(s)) return 'Tied on score'
  if (m.close.includes(s)) return `${pts(winner.overall - s.overall)} behind`
  return null
}

/**
 * The same two labels for the phone's sticky key, where every line costs reading space on each scroll: visible
 * shorthand, read out in full. null where the long form has nothing to say.
 */
export function keyQualifier(m: Margin | null): { shown: string; spoken: string } | null {
  const spoken = winnerQualifier(m)
  if (!m || !spoken) return null
  return { shown: m.kind === 'tie' ? 'tied' : `by ${m.gap} pt${m.gap === 1 ? '' : 's'}`, spoken }
}

export function keyContender(m: Margin | null, s: Scored, winner: Scored): { shown: string; spoken: string } | null {
  const spoken = contenderTag(m, s, winner)
  if (!m || !spoken) return null
  const gap = winner.overall - s.overall
  return { shown: m.tied.includes(s) ? 'Tied' : `−${gap} pt${gap === 1 ? '' : 's'}`, spoken }
}

/** For the comparison table's caption. */
export function captionLine(v: Verdict, m: Margin): string {
  const w = v.winner!.product.name
  if (m.kind === 'tie') return `${w} is best overall on the tie-break; it ties ${nameList(m.tied)} on ${v.winner!.overall}.`
  if (m.kind === 'narrow') return `${w} is best overall, a narrow lead of ${pts(m.gap)} over ${m.runnerUp.product.name}.`
  return `${w} is best overall.`
}

/** Appended to the team-size announcement, so a change in certainty is heard, not only seen. */
export function announceLine(v: Verdict, m: Margin): string {
  const w = v.winner!.product.name
  if (m.kind === 'tie') return `Best overall: ${w}, tied on score with ${nameList(m.tied)} and first on the tie-break.`
  if (m.kind === 'narrow') return `Best overall: ${w}, a narrow lead of ${pts(m.gap)}.`
  return `Best overall: ${w}.`
}

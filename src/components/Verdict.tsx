import { adminCoverage, coreCoverage, usd, AREAS, type Area, type Scored, type Verdict as V } from '../lib/score.ts'
import { Mark } from './Mark.tsx'

const CURVE = { gentle: 'gentle', moderate: 'moderate', steep: 'steep' } as const

const AREA_PHRASE: Record<Area, string> = {
  capability: 'capability',
  value: 'value for your team',
  ease: 'ease of adoption',
  rating: 'user rating',
  admin: 'admin and security',
  support: 'support',
}

/** Why someone might pick `s` over the winner, stated with the numbers behind it. */
function reason(area: Area, s: Scored, w: Scored, team: number): string {
  const p = s.product
  switch (area) {
    case 'value':
      return `Budget comes first: ${usd(s.cost.total)} a month for ${team} people, against ${usd(w.cost.total)}.`
    case 'capability': {
      const c = coreCoverage(p)
      return `You need the widest feature set: ${c.full} of ${c.total} core features included, against ${coreCoverage(w.product).full}.`
    }
    case 'ease':
      return `The team must be productive quickly: ${CURVE[p.onboarding.curve]} learning curve, about ${p.onboarding.setup} to set up.`
    case 'rating':
      return `Day-to-day satisfaction matters most: rated ${p.rating.toFixed(1)} from ${p.reviews.toLocaleString('en-US')} demo reviews, against ${w.product.rating.toFixed(1)}.`
    case 'admin': {
      const a = adminCoverage(p)
      return `You need admin and security controls: ${a.full} of ${a.total} included, against ${adminCoverage(w.product).full}.`
    }
    case 'support':
      return `You want faster help: ${p.support.channels.toLowerCase()}, first response ${p.support.response.toLowerCase()}.`
  }
}

const join = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

export function Verdict({ verdict, team }: { verdict: V; team: number }) {
  const { winner, ranked, excluded, tieBreak, leaders } = verdict
  const excludedNote = excluded.length > 0 && (
    <p className="verdict-excluded">
      {join(excluded.map((s) => s.product.name))} {excluded.length === 1 ? 'is' : 'are'} left out of the verdict:{' '}
      {excluded.map((s) => `${s.product.name} ${s.cost.reason?.toLowerCase()}`).join('; ')}, and your team is {team}.
    </p>
  )

  if (!winner) {
    return (
      <div className="verdict verdict-none">
        <h3 className="verdict-title">No verdict for this set yet</h3>
        <p>
          {ranked.length === 1
            ? `${ranked[0].product.name} is the only product here that can serve a team of ${team}. Add another to get a verdict.`
            : `None of these products can serve a team of ${team}.`}
        </p>
        {excludedNote}
      </div>
    )
  }

  const runnerUp = ranked[1]
  const winnerLeads = AREAS.filter((a) => leaders[a].some((s) => s.product.id === winner.product.id))
  const others = ranked.slice(1).map((s) => ({
    s,
    areas: AREAS.filter((a) => leaders[a].some((l) => l.product.id === s.product.id) && !winnerLeads.includes(a)),
  })).filter((o) => o.areas.length > 0)

  const margin = winner.overall - runnerUp.overall
  const why = tieBreak
    ? `It ties ${runnerUp.product.name} on ${winner.overall} and ranks first on ${
        tieBreak === 'rating'
          ? `its higher user rating (${winner.product.rating.toFixed(1)} against ${runnerUp.product.rating.toFixed(1)})`
          : tieBreak === 'price' ? 'its lower price for your team' : 'name order, as the two are otherwise equal'
      }.`
    : `It scores ${winner.overall}, ${margin} ${margin === 1 ? 'point' : 'points'} ahead of ${runnerUp.product.name}.`

  return (
    <div className="verdict">
      <p className="verdict-kicker">Best overall of your {ranked.length + excluded.length} for a team of {team}</p>
      <h3 className="verdict-title">
        <Mark product={winner.product} size={28} />
        <span>{winner.product.name}</span>
        <span className="verdict-score"><span className="num">{winner.overall}</span><span className="muted"> / 100</span></span>
      </h3>
      <p className="verdict-why">
        {why}{' '}
        {winnerLeads.length > 0
          ? `Among your picks it leads on ${join(winnerLeads.map((a) => AREA_PHRASE[a]))}.`
          : 'It leads no single area, but has the best balance across all six.'}
      </p>

      <h4 className="verdict-sub">Where the others are stronger</h4>
      {others.length > 0 ? (
        <ul className="tradeoffs">
          {others.map(({ s, areas }) => (
            <li key={s.product.id}>
              <span className="tradeoff-name"><Mark product={s.product} size={18} />Choose {s.product.name} if</span>
              <ul>{areas.map((a) => <li key={a}>{reason(a, s, winner, team)}</li>)}</ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tradeoff-none">
          None of your other picks leads in any area, so {winner.product.name} is ahead across the board for this set.
          The score still cannot see your workflow: check the rows below for the details that matter to you.
        </p>
      )}
      {excludedNote}
      <p className="verdict-method"><a href="#method">How the score works</a></p>
    </div>
  )
}

import { AREA_LABEL, breakdown, type Breakdown, type Margin, type Scored } from '../lib/score.ts'
import { join } from '../lib/certainty.ts'
import { Mark } from './Mark.tsx'

interface Props {
  winner: Scored
  runnerUp: Scored
  margin: Margin
  /** set when other picks are left out of this pair: opens every pick's area scores */
  onShowAreas?: () => void
}

/** Where the winner's score and the runner-up's differ, area by area, in points of the score before rounding. */
export function ScoreBreakdown({ winner, runnerUp, margin, onShowAreas }: Props) {
  const b = breakdown(winner, runnerUp)
  const widest = Math.max(...b.forA.map((c) => c.points), ...b.forB.map((c) => c.points))
  return (
    <div className="breakdown">
      <h4 className="verdict-sub">How {winner.product.name} and {runnerUp.product.name} compare, area by area</h4>
      <div className="breakdown-cols">
        <Side id="bd-a" who={winner} items={b.forA} widest={widest} />
        <Side id="bd-b" who={runnerUp} items={b.forB} widest={widest} />
      </div>
      {b.even.length > 0 && <p className="breakdown-even">Even: {join(b.even.map((a) => AREA_LABEL[a].toLowerCase()))}.</p>}
      <p className="breakdown-note">
        {margin.kind === 'tie'
          ? 'Points out of 100, before rounding. They show the trade-offs; the tie is settled by the rule above, not by these points.'
          : `Points out of 100, before rounding, so they may not add up to the ${margin.gap}-point gap between the rounded scores.`}
      </p>
      {onShowAreas && (
        <button type="button" className="btn btn-link small" onClick={onShowAreas}>Compare all six areas for every pick</button>
      )}
    </div>
  )
}

function Side({ id, who, items, widest }: { id: string; who: Scored; items: Breakdown['forA']; widest: number }) {
  return (
    <div className="breakdown-side">
      <p className="breakdown-who" id={id}><Mark product={who.product} size={18} />{who.product.name} gains</p>
      {items.length > 0 ? (
        <ul aria-labelledby={id}>
          {items.map((c) => (
            <li key={c.area}>
              <span className="bd-area">{AREA_LABEL[c.area]}</span>
              <span className="bd-bar" aria-hidden="true"><span style={{ width: `${(c.points / widest) * 100}%` }} /></span>
              <span className="bd-pts num">+{c.points.toFixed(1)}<span className="sr-only"> points</span></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="breakdown-none">In no area</p>
      )}
    </div>
  )
}

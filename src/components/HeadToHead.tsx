import { useMemo, useState } from 'react'
import { MAX_SELECTED } from '../lib/selection.ts'
import { compareScored, nearestBy, usd, verdictFor, type Scored } from '../lib/score.ts'
import { Mark } from './Mark.tsx'
import { Verdict } from './Verdict.tsx'
import { bestIn, buildGroups, groupLeader, isIdentical, type Group } from './rows.tsx'

interface Props {
  scores: Map<string, Scored>
  ids: string[]
  team: number
  onRemove: (id: string, focusTarget: string) => void
  onSelect: (ids: string[], message: string) => void
  onAnnounce: (text: string) => void
}

export function HeadToHead({ scores, ids, team, onRemove, onSelect, onAnnounce }: Props) {
  const [diffOnly, setDiffOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const picked = ids.map((id) => scores.get(id)).filter((s): s is Scored => !!s)
  const verdict = useMemo(() => verdictFor(ids, scores), [ids, scores])
  const groups = useMemo(() => buildGroups(team), [team])
  const winnerId = verdict.winner?.product.id

  const visible = groups.map((g) => ({ g, rows: diffOnly ? g.rows.filter((r) => !isIdentical(r, picked)) : g.rows }))
  const hiddenCount = groups.reduce((n, g) => n + g.rows.filter((r) => isIdentical(r, picked)).length, 0)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      onAnnounce('Link to this comparison copied.')
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      onAnnounce("Couldn't copy the link. Copy the address from your browser's address bar instead.")
    }
  }

  return (
    <section className="h2h" id="compare" aria-labelledby="compare-title">
      <div className="wrap">
        <div className="h2h-head">
          <h2 id="compare-title" tabIndex={-1}>Head-to-head</h2>
          <p className="section-sub">Only the products you ticked, priced for a team of {team}.</p>
        </div>

        {picked.length === 0 && <EmptyState scores={scores} onSelect={onSelect} />}
        {picked.length === 1 && <OneState only={picked[0]} scores={scores} ids={ids} team={team} onSelect={onSelect} />}

        {picked.length >= 2 && (
          <>
            <Verdict verdict={verdict} team={team} />

            <div className="h2h-tools">
              <label className="switch">
                <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
                <span className="switch-track" aria-hidden="true" />
                <span>
                  Show only differences
                  <span className="muted small"> ({hiddenCount} {hiddenCount === 1 ? 'row is' : 'rows are'} the same for all)</span>
                </span>
              </label>
              <button type="button" className="btn btn-quiet" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy link to this comparison'}
              </button>
            </div>

            <MatrixTable picked={picked} groups={visible} winnerId={winnerId} team={team} onRemove={onRemove} />
            <Stacks picked={picked} groups={visible} winnerId={winnerId} />
          </>
        )}
      </div>
    </section>
  )
}

type Visible = { g: Group; rows: Group['rows'] }[]

function MatrixTable({ picked, groups, winnerId, team, onRemove }: {
  picked: Scored[]; groups: Visible; winnerId?: string; team: number; onRemove: Props['onRemove']
}) {
  const names = picked.map((s) => s.product.name).join(', ')
  const winner = picked.find((s) => s.product.id === winnerId)
  return (
    <table className="matrix" data-count={picked.length}>
      <caption className="sr-only">
        Head-to-head comparison of {names} for a team of {team}.{winner ? ` ${winner.product.name} is best overall.` : ''}
      </caption>
      <thead>
        <tr>
          <td className="m-corner" />
          {picked.map((s, i) => {
            const best = s.product.id === winnerId
            return (
              <th key={s.product.id} scope="col" className="m-head" data-best={best || undefined}>
                <span className="m-head-top">
                  <span className="slot-n" aria-hidden="true">{i + 1}</span>
                  {best && <span className="best-label"><BestGlyph />Best overall</span>}
                  {!s.cost.eligible && <span className="out-label">Can't serve {team}</span>}
                </span>
                <span className="m-head-name"><Mark product={s.product} size={22} />{s.product.name}</span>
                <span className="m-head-meta">
                  <span><span className="num">{s.overall}</span> / 100</span>
                  <button type="button" className="btn btn-link small" onClick={() => onRemove(s.product.id, 'compare-title')}>
                    Remove<span className="sr-only"> {s.product.name}</span>
                  </button>
                </span>
              </th>
            )
          })}
        </tr>
      </thead>
      {groups.map(({ g, rows }) => {
        const leader = groupLeader(g, picked)
        return (
          <tbody key={g.key}>
            <tr className="m-group">
              <th scope="rowgroup" colSpan={picked.length + 1}>
                <span className="m-group-title">{g.title}</span>
                {leader && <span className="m-group-leader">{leader}</span>}
                {rows.length === 0 && <span className="m-group-leader">All rows the same for your picks</span>}
              </th>
            </tr>
            {rows.map((r) => {
              const best = bestIn(r, picked)
              return (
                <tr key={r.key}>
                  <th scope="row" className="m-label">
                    {r.label}
                    {r.hint && <span className="m-hint">{r.hint}</span>}
                  </th>
                  {picked.map((s) => (
                    <td key={s.product.id} data-best={s.product.id === winnerId || undefined}>
                      <span className="val">{r.render(s)}</span>
                      {best.has(s.product.id) && <span className="row-best">{r.best!.tag}</span>}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        )
      })}
    </table>
  )
}

/** Narrow screens: attribute-first stacks keep every pick's value for one attribute together. */
function Stacks({ picked, groups, winnerId }: { picked: Scored[]; groups: Visible; winnerId?: string }) {
  return (
    <div className="stacks">
      <label className="jump">
        <span>Jump to</span>
        <select
          defaultValue=""
          onChange={(e) => {
            const target = document.getElementById(`s-${e.target.value}`)
            target?.scrollIntoView({ block: 'start' })
            target?.focus({ preventScroll: true })
            e.target.value = ''
          }}
        >
          <option value="" disabled>Choose a section</option>
          {groups.map(({ g }) => <option key={g.key} value={g.key}>{g.title}</option>)}
        </select>
      </label>
      <ol className="stack-key" aria-label="Your picks">
        {picked.map((s, i) => (
          <li key={s.product.id} data-best={s.product.id === winnerId || undefined}>
            <span className="slot-n" aria-hidden="true">{i + 1}</span>
            <Mark product={s.product} size={18} />
            <span className="stack-key-name">{s.product.name}</span>
            {s.product.id === winnerId && <span className="best-label"><BestGlyph /><span className="best-text">Best</span><span className="sr-only"> overall</span></span>}
          </li>
        ))}
      </ol>
      {groups.map(({ g, rows }) => {
        const leader = groupLeader(g, picked)
        return (
          <section key={g.key} className="sgroup" aria-labelledby={`s-${g.key}`}>
            <h3 id={`s-${g.key}`} tabIndex={-1}>{g.title}</h3>
            {leader && <p className="m-group-leader">{leader}</p>}
            {rows.length === 0 && <p className="m-group-leader">All rows the same for your picks</p>}
            {rows.map((r) => {
              const best = bestIn(r, picked)
              const id = `s-${g.key}-${r.key}`
              return (
                <div key={r.key} className="srow">
                  <h4 id={id}>{r.label}{r.hint && <span className="m-hint"> {r.hint}</span>}</h4>
                  <ul aria-labelledby={id}>
                    {picked.map((s, i) => (
                      <li key={s.product.id} data-best={s.product.id === winnerId || undefined}>
                        <span className="slot-n" aria-hidden="true">{i + 1}</span>
                        <span className="srow-name">{s.product.name}<span className="sr-only">:</span></span>
                        <span className="srow-val">
                          <span className="val">{r.render(s)}</span>
                          {best.has(s.product.id) && <span className="row-best">{r.best!.tag}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

function BestGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 1l1.5 3.2 3.5.4-2.6 2.4.7 3.5L6 8.8 2.9 10.5l.7-3.5L1 4.6l3.5-.4z" fill="currentColor" />
    </svg>
  )
}

function EmptyState({ scores, onSelect }: { scores: Map<string, Scored>; onSelect: Props['onSelect'] }) {
  const top = [...scores.values()].filter((s) => s.cost.eligible).sort(compareScored).slice(0, 3)
  return (
    <div className="state state-empty">
      <ol className="ghost-slots" aria-hidden="true">
        {Array.from({ length: MAX_SELECTED }, (_, i) => <li key={i}><span className="slot-n">{i + 1}</span></li>)}
      </ol>
      <div>
        <h3>Nothing to compare yet</h3>
        <p>
          Tick up to four tools in the table above. They line up here attribute by attribute, with a best overall,
          the reasons behind it, and where each of the others is stronger.
        </p>
        <div className="state-actions">
          <a className="btn btn-quiet" href="#ledger">Go to the table</a>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => onSelect(top.map((s) => s.product.id), `Added the top three by score: ${top.map((s) => s.product.name).join(', ')}.`)}
          >
            Try the top three by score
          </button>
        </div>
      </div>
    </div>
  )
}

function OneState({ only, scores, ids, team, onSelect }: {
  only: Scored; scores: Map<string, Scored>; ids: string[]; team: number; onSelect: Props['onSelect']
}) {
  const near = nearestBy(only.product.id, scores, 3)
  return (
    <div className="state state-one">
      <h3>{only.product.name} is in. Add at least one more to compare.</h3>
      <p>
        A comparison needs two products. {only.product.name} scores {only.overall} for a team of {team}.
        These are the closest to it on score:
      </p>
      <ul className="near">
        {near.map((s) => (
          <li key={s.product.id}>
            <Mark product={s.product} size={22} />
            <span className="near-text">
              <strong>{s.product.name}</strong>
              <span className="muted small">{s.product.bestFor}. Scores {s.overall}, {usd(s.cost.total)} a month.</span>
            </span>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => onSelect([...ids, s.product.id], `${s.product.name} added to the comparison. ${ids.length + 1} of 4 selected.`)}
            >
              Add<span className="sr-only"> {s.product.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { MAX_SELECTED } from '../lib/selection.ts'
import { compareScored, nearestBy, usd, verdictFor, type Scored } from '../lib/score.ts'
import { focusVisible } from '../lib/focus.ts'
import { Mark } from './Mark.tsx'
import { Verdict } from './Verdict.tsx'
import { aheadOfWinner, bestIn, buildGroups, groupStanding, statusOf, type Group, type Row, type RowStatus } from './rows.tsx'

interface Props {
  scores: Map<string, Scored>
  ids: string[]
  team: number
  onRemove: (id: string, focusTarget: string) => void
  onSelect: (ids: string[], message: string) => void
  onAnnounce: (text: string) => void
}

export function HeadToHead({ scores, ids, team, onRemove, onSelect, onAnnounce }: Props) {
  const [chosenView, setView] = useState<View>('all')
  // the chosen view is part of a shared link (?view=behind|diff); applied after hydration
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view')
    if (v === 'behind' || v === 'diff') setView(v)
  }, [])
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (chosenView === 'all') q.delete('view')
    else q.set('view', chosenView)
    const query = q.toString().replace(/%2C/g, ',')
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [chosenView])
  const [copied, setCopied] = useState(false)
  const picked = ids.map((id) => scores.get(id)).filter((s): s is Scored => !!s)
  const verdict = useMemo(() => verdictFor(ids, scores), [ids, scores])
  const groups = useMemo(() => buildGroups(team), [team])
  const winner = verdict.winner ?? undefined
  const winnerId = winner?.product.id
  // "behind" only exists while there is a winner
  const view: View = chosenView === 'behind' && !winner ? 'all' : chosenView

  const classified = groups.map((g) => ({ g, rows: g.rows.map((row) => ({ row, status: statusOf(row, picked, winnerId) })) }))
  const all = classified.flatMap((c) => c.rows)
  const counts: Record<View, number> = {
    behind: all.filter((r) => inView(r.status, 'behind', r.row)).length,
    diff: all.filter((r) => r.status !== 'same').length,
    all: all.length,
  }
  const visible = classified.map((c) => ({ g: c.g, rows: c.rows.filter((r) => inView(r.status, view, r.row)) }))

  function showBehind() {
    setView('behind')
    onAnnounce(`Showing the ${counts.behind} rows where ${winner?.product.name} is behind.`)
    focusVisible('view-control')
  }

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
            <Verdict verdict={verdict} team={team} behindCount={counts.behind} onShowBehind={showBehind} />

            <div className="h2h-tools">
              <fieldset className="views" id="view-control" tabIndex={-1}>
                <legend>Show rows</legend>
                <div className="views-options">
                  {VIEWS.filter((v) => v !== 'behind' || winner).map((v) => (
                    <label key={v} className="view-opt">
                      <input type="radio" name="h2h-view" value={v} checked={view === v} onChange={() => setView(v)} />
                      <span className="view-name">{v === 'behind' ? `Where ${winner?.product.name} is behind` : VIEW_LABEL[v]}</span>
                      <span className="view-count">{counts[v]}<span className="sr-only"> rows</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="button" className="btn btn-quiet" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy link to this comparison'}
              </button>
            </div>

            <MatrixTable picked={picked} groups={visible} winner={winner} view={view} team={team} onRemove={onRemove} />
            <Stacks picked={picked} groups={visible} winner={winner} view={view} />
          </>
        )}
      </div>
    </section>
  )
}

type View = 'behind' | 'diff' | 'all'
const VIEWS: View[] = ['behind', 'diff', 'all']
const VIEW_LABEL: Record<View, string> = { behind: 'Where the winner is behind', diff: 'All differences', all: 'Everything' }
/** Score areas summarise other rows, so the "behind" view leaves them out instead of counting the same point twice. */
const inView = (status: RowStatus, view: View, row: Row) =>
  view === 'all' || (view === 'diff' ? status !== 'same' : status === 'behind' && !row.derived)

type Visible = { g: Group; rows: { row: Row; status: RowStatus }[] }[]

/** Message for a group that has no rows in the current view; it never claims more than the ranking can show. */
function emptyNote(view: View, g: Group, picked: Scored[], winner?: Scored) {
  if (view !== 'behind') return 'Same for all your picks here'
  if (g.key === 'score') return 'Score areas summarise the rows below; see Everything for them'
  const unranked = g.rows.filter((r) => statusOf(r, picked, winner?.product.id) === 'differs').length
  const base = `${winner?.product.name} is not behind on any ranked row here`
  return unranked ? `${base}; ${unranked} other ${unranked === 1 ? 'difference is' : 'differences are'} in Everything` : base
}

const names = (list: Scored[]) =>
  list.length <= 1 ? list.map((s) => s.product.name).join('') : `${list.slice(0, -1).map((s) => s.product.name).join(', ')} and ${list.at(-1)!.product.name}`

/** "Northlane behind Orbitask": says who beats the winner on this row. */
function BehindFlag({ winner, row, picked }: { winner: Scored; row: Row; picked: Scored[] }) {
  return <span className="row-flag">{winner.product.name} behind {names(aheadOfWinner(row, picked, winner))}</span>
}

function MatrixTable({ picked, groups, winner, view, team, onRemove }: {
  picked: Scored[]; groups: Visible; winner?: Scored; view: View; team: number; onRemove: Props['onRemove']
}) {
  const names = picked.map((s) => s.product.name).join(', ')
  const winnerId = winner?.product.id
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
        const standing = groupStanding(g, picked, winner)
        return (
          <tbody key={g.key}>
            <tr className="m-group">
              <th scope="rowgroup" colSpan={picked.length + 1} id={`m-${g.key}`} tabIndex={-1}>
                <span className="m-group-title">{g.title}</span>
                {standing && <span className="m-group-leader">{standing}</span>}
                {rows.length === 0 && <span className="m-group-empty">{emptyNote(view, g, picked, winner)}</span>}
              </th>
            </tr>
            {rows.map(({ row: r, status }) => {
              const best = bestIn(r, picked)
              return (
                <tr key={r.key} data-status={status}>
                  <th scope="row" className="m-label" id={`m-${g.key}-${r.key}`} tabIndex={-1}>
                    {r.label}
                    {r.hint && <span className="m-hint">{r.hint}</span>}
                    {status === 'behind' && winner && <BehindFlag winner={winner} row={r} picked={picked} />}
                    {status === 'same' && <span className="m-hint">{picked.length === 2 ? 'Same for both' : 'Same for all'}</span>}
                  </th>
                  {picked.map((s) => (
                    <td key={s.product.id} data-best={s.product.id === winnerId || undefined}>
                      <span className="val">{r.render(s)}</span>
                      {best.has(s.product.id) && <span className="row-best">{r.tag}</span>}
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
function Stacks({ picked, groups, winner, view }: { picked: Scored[]; groups: Visible; winner?: Scored; view: View }) {
  const winnerId = winner?.product.id
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
        const standing = groupStanding(g, picked, winner)
        return (
          <section key={g.key} className="sgroup" aria-labelledby={`s-${g.key}`}>
            <h3 id={`s-${g.key}`} tabIndex={-1}>{g.title}</h3>
            {standing && <p className="m-group-leader">{standing}</p>}
            {rows.length === 0 && <p className="m-group-empty">{emptyNote(view, g, picked, winner)}</p>}
            {rows.map(({ row: r, status }) => {
              const best = bestIn(r, picked)
              const id = `s-${g.key}-${r.key}`
              if (status === 'same') {
                // identical for every pick: say it once instead of repeating it per product
                return (
                  <div key={r.key} className="srow" data-status="same">
                    <h4 id={id} tabIndex={-1}>{r.label}{r.hint && <span className="m-hint"> {r.hint}</span>}</h4>
                    <p className="srow-same"><span className="srow-name">{picked.length === 2 ? 'Same for both' : `Same for all ${picked.length}`}:</span> <span className="val">{r.render(picked[0])}</span></p>
                  </div>
                )
              }
              return (
                <div key={r.key} className="srow" data-status={status}>
                  <h4 id={id} tabIndex={-1}>{r.label}{r.hint && <span className="m-hint"> {r.hint}</span>}{status === 'behind' && winner && <BehindFlag winner={winner} row={r} picked={picked} />}</h4>
                  <ul aria-labelledby={id}>
                    {picked.map((s, i) => (
                      <li key={s.product.id} data-best={s.product.id === winnerId || undefined}>
                        <span className="slot-n" aria-hidden="true">{i + 1}</span>
                        <span className="srow-name">{s.product.name}<span className="sr-only">:</span></span>
                        <span className="srow-val">
                          <span className="val">{r.render(s)}</span>
                          {best.has(s.product.id) && <span className="row-best">{r.tag}</span>}
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

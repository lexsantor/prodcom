import { useEffect, useMemo, useRef, useState } from 'react'
import { MAX_SELECTED } from '../lib/selection.ts'
import { marginOf, nearestBy, topEligible, usd, verdictFor, type Margin, type Scored, type Verdict as VerdictT } from '../lib/score.ts'
import { captionLine, contenderTag, keyContender, keyQualifier, winnerQualifier } from '../lib/certainty.ts'
import { focusLedger, focusVisible } from '../lib/focus.ts'
import { setTrackContext, startComparison, track } from '../lib/track.ts'
import { NotScored, unservable } from './Ledger.tsx'
import { Mark } from './Mark.tsx'
import { Visit } from './Visit.tsx'
import { Verdict } from './Verdict.tsx'
import { ESSENTIAL, aheadOfWinner, bestIn, buildGroups, groupStanding, statusOf, type Group, type Row, type RowStatus } from './rows.tsx'

interface Props {
  scores: Map<string, Scored>
  ids: string[]
  team: number
  onRemove: (id: string, focusTarget: string) => void
  onSelect: (ids: string[], message: string, focusTarget?: string, source?: 'suggestion' | 'top-three') => void
  onAnnounce: (text: string) => void
}

export function HeadToHead({ scores, ids, team, onRemove, onSelect, onAnnounce }: Props) {
  const [view, setView] = useState<View>('key')
  // the chosen view is part of a shared link (?view=essential|all); applied after hydration.
  // Links from before the three-level views (?view=behind|diff) open on key differences.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view')
    if (v === 'essential' || v === 'all') setView(v)
  }, [])
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (view === 'key') q.delete('view')
    else q.set('view', view)
    const query = q.toString().replace(/%2C/g, ',')
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [view])
  const [copied, setCopied] = useState(false)
  const picked = ids.map((id) => scores.get(id)).filter((s): s is Scored => !!s)
  const verdict = useMemo(() => verdictFor(ids, scores), [ids, scores])
  const groups = useMemo(() => buildGroups(team), [team])
  const winner = verdict.winner ?? undefined
  const winnerId = winner?.product.id
  const margin = marginOf(verdict)
  const certainty = { verdict, margin }
  const classified = groups.map((g) => ({ g, rows: g.rows.map((row): Classified => ({ row, status: statusOf(row, picked, winnerId), gkey: g.key })) }))
  const all = classified.flatMap((c) => c.rows)
  const counts: Record<View, number> = {
    key: all.filter((r) => inView(r, 'key')).length,
    essential: all.filter((r) => inView(r, 'essential')).length,
    all: all.length,
  }
  const behindCount = all.filter((r) => r.status === 'behind' && !r.row.derived).length
  const visible = classified
    .map((c) => ({ g: c.g, rows: c.rows.filter((r) => inView(r, view)) }))
    .filter((c) => view !== 'essential' || c.rows.length > 0)

  useEffect(() => setTrackContext({ winner_id: winnerId ?? null, view: picked.length >= 2 ? view : null }), [winnerId, view, picked.length])

  // comparison_started (scroll | link): the heading reaches the upper half of the viewport with 2+ picks.
  // The heading is small and fixed-height, so this works however tall the comparison grows; a share of the
  // whole section cannot (a 4-pick phone comparison is ~12 viewports tall). Deduplicated with the tray's
  // "Compare N" in one registry (startComparison), once per set of picks.
  const headingRef = useRef<HTMLHeadingElement>(null)
  /** the page was opened on #compare: the first sighting of the heading is the link's doing, not a scroll */
  const fromLink = useRef(typeof window !== 'undefined' && window.location.hash === '#compare')
  const setKey = [...ids].sort().join(',')
  useEffect(() => {
    const el = headingRef.current
    if (!el || ids.length < 2 || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      const trigger = fromLink.current ? 'link' : 'scroll'
      fromLink.current = false
      if (!entry.isIntersecting) return
      startComparison(ids, trigger)
      io.disconnect()
    }, { rootMargin: '0px 0px -50% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [setKey]) // one observer per set of picks; ids is read through setKey

  function chooseView(v: View) {
    track({ event: 'comparison_view_changed', from: view, to: v, rows: counts[v], trigger: 'control' })
    setView(v)
    onAnnounce(`Showing ${VIEW_LABEL[v].toLowerCase()}: ${counts[v]} rows.`)
  }

  /** From the verdict: key differences include every row where the winner is behind; land on the first one. */
  function showBehind() {
    if (view !== 'key') track({ event: 'comparison_view_changed', from: view, to: 'key', rows: counts.key, trigger: 'verdict' })
    setView('key')
    onAnnounce(`Showing key differences. ${winner?.product.name} is behind on ${behindCount} of them, each flagged.`)
    const first = classified.flatMap((c) => c.rows.filter((r) => r.status === 'behind' && !r.row.derived).map((r) => `${c.g.key}-${r.row.key}`))[0]
    focusVisible(...(first ? [`m-${first}`, `s-${first}`] : []), 'view-control')
  }

  /** From the score breakdown: every pick's six area scores live in the complete matrix, under the score group. */
  function showAreas() {
    if (view !== 'all') track({ event: 'comparison_view_changed', from: view, to: 'all', rows: counts.all, trigger: 'verdict' })
    setView('all')
    onAnnounce(`Showing the complete matrix: ${counts.all} rows. The six score areas are under Prodcom score.`)
    focusVisible('m-score', 's-score')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      track({ event: 'comparison_shared', method: 'copy_link' })
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
          <div>
            <h2 id="compare-title" tabIndex={-1} ref={headingRef}>Head-to-head</h2>
            <p className="section-sub">Only the products you ticked, priced for a team of {team}.</p>
          </div>
          {picked.length > 0 && (
            <a className="btn btn-quiet back-link" href="#ledger" onClick={(e) => { e.preventDefault(); focusLedger() }}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M7 12V3M3 6.5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
              Change products
            </a>
          )}
        </div>

        {picked.length === 0 && <EmptyState scores={scores} onSelect={onSelect} />}
        {picked.length === 1 && <OneState only={picked[0]} scores={scores} ids={ids} team={team} onSelect={onSelect} />}

        {picked.length >= 2 && (
          <>
            <Verdict verdict={verdict} team={team} behindCount={behindCount} onShowBehind={showBehind} onShowAreas={showAreas} />

            <div className="h2h-tools">
              <fieldset className="views" id="view-control" tabIndex={-1}>
                <legend>Show rows</legend>
                <div className="views-options">
                  {VIEWS.map((v) => (
                    <label key={v} className="view-opt">
                      <input type="radio" name="h2h-view" value={v} checked={view === v} onChange={() => chooseView(v)} />
                      <span className="view-name">{VIEW_LABEL[v]}</span>
                      <span className="view-count">{counts[v]}<span className="sr-only"> rows</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="button" className="btn btn-quiet" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy link to this comparison'}
              </button>
            </div>

            <SectionNav groups={visible} />
            <MatrixTable picked={picked} groups={visible} winner={winner} certainty={certainty} team={team} onRemove={onRemove} />
            <Stacks picked={picked} groups={visible} winner={winner} certainty={certainty} team={team} />
          </>
        )}
      </div>
    </section>
  )
}

type View = 'key' | 'essential' | 'all'
const VIEWS: View[] = ['key', 'essential', 'all']
const VIEW_LABEL: Record<View, string> = { key: 'Key differences', essential: 'Essentials', all: 'Complete matrix' }
type Classified = { row: Row; status: RowStatus; gkey: string }
/**
 * key: ranked rows where your picks differ (a better and a worse value exist). Score areas summarise other rows,
 * so they stay out instead of counting the same point twice. essential: the curated ESSENTIAL rows. all: every row.
 */
function inView({ row, status, gkey }: Classified, view: View) {
  if (view === 'all') return true
  if (view === 'essential') return ESSENTIAL.has(`${gkey}:${row.key}`)
  return status !== 'same' && !!row.rank && !row.derived
}

type Visible = { g: Group; rows: Classified[] }[]

/** Message for a group with no rows in the key view; it never claims more than the ranking can show. */
function emptyNote(g: Group, picked: Scored[]) {
  if (g.key === 'score') return 'The verdict breaks the score down by area. Area scores for every pick are in the complete matrix'
  const other = g.rows.filter((r) => statusOf(r, picked) !== 'same').length
  if (!other) return 'Same for all your picks here'
  return `No ranked differences; ${other} other ${other === 1 ? 'difference is' : 'differences are'} in the complete matrix`
}

const names = (list: Scored[]) =>
  list.length <= 1 ? list.map((s) => s.product.name).join('') : `${list.slice(0, -1).map((s) => s.product.name).join(', ')} and ${list.at(-1)!.product.name}`

/** Says who beats the winner on this row: visibly "Orbitask leads", in full for screen readers. */
function BehindFlag({ winner, row, picked }: { winner: Scored; row: Row; picked: Scored[] }) {
  const leaders = aheadOfWinner(row, picked, winner)
  return (
    <span className="row-flag">
      <span className="sr-only">{winner.product.name} behind {names(leaders)}</span>
      <span aria-hidden="true"><span className="row-flag-mark" />{names(leaders)} {leaders.length > 1 ? 'lead' : 'leads'}</span>
    </span>
  )
}

/** Section index with the row count each group holds in the current view. Plain links: no navigation on arrow keys. */
function SectionNav({ groups }: { groups: Visible }) {
  return (
    <nav className="secnav" aria-label="Comparison sections">
      <ul>
        {groups.map(({ g, rows }) => (
          <li key={g.key}>
            <a href={`#m-${g.key}`} onClick={(e) => { e.preventDefault(); focusVisible(`m-${g.key}`, `s-${g.key}`) }}>
              {g.title}<span className="secnav-n">{rows.length}<span className="sr-only"> rows</span></span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The verdict and how far its winner is ahead, for the labels every surface repeats. */
type Certainty = { verdict: VerdictT; margin: Margin | null }

function MatrixTable({ picked, groups, winner, certainty, team, onRemove }: {
  picked: Scored[]; groups: Visible; winner?: Scored; certainty: Certainty; team: number; onRemove: Props['onRemove']
}) {
  const names = picked.map((s) => s.product.name).join(', ')
  const winnerId = winner?.product.id
  return (
    <table className="matrix" data-count={picked.length}>
      <caption className="sr-only">
        Head-to-head comparison of {names} for a team of {team}.{certainty.margin ? ` ${captionLine(certainty.verdict, certainty.margin)}` : ''}
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
                  {best && <BestLabel margin={certainty.margin} />}
                  {winner && <Contender margin={certainty.margin} s={s} winner={winner} />}
                  {!s.cost.eligible && <span className="out-label">Can't serve {team}</span>}
                </span>
                <span className="m-head-name"><Mark product={s.product} size={28} />{s.product.name}</span>
                <span className="m-head-meta">{s.cost.eligible ? <><span className="num">{s.overall}</span> / 100</> : <NotScored s={s} team={team} />}</span>
              </th>
            )
          })}
        </tr>
        {/* Actions sit outside the header cells so each column header announces only the product. */}
        <tr className="m-actions">
          <td />
          {picked.map((s) => (
            <td key={s.product.id} data-best={s.product.id === winnerId || undefined}>
              <Visit product={s.product} placement="matrix" variant={s.product.id === winnerId ? 'solid' : 'quiet'} note={s.cost.eligible ? undefined : unservable(s)} />
              <button type="button" className="btn btn-link small" onClick={() => onRemove(s.product.id, 'compare-title')}>
                Remove<span className="sr-only"> {s.product.name}</span>
              </button>
            </td>
          ))}
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
                {rows.length === 0 && <span className="m-group-empty">{emptyNote(g, picked)}</span>}
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
                    <td key={s.product.id} data-best={s.product.id === winnerId || undefined} data-top={best.has(s.product.id) || undefined}>
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
function Stacks({ picked, groups, winner, certainty, team }: { picked: Scored[]; groups: Visible; winner?: Scored; certainty: Certainty; team: number }) {
  const winnerId = winner?.product.id
  return (
    <div className="stacks">
      {/* One Visit per pick, as the desktop matrix has. Not sticky: it scrolls away with the top of the comparison. */}
      <ul className="stack-actions" aria-label="Vendor sites for your picks">
        {picked.map((s, i) => {
          const best = s.product.id === winnerId
          return (
            <li key={s.product.id} data-best={best || undefined}>
              <span className="slot-n" aria-hidden="true">{i + 1}</span>
              <Mark product={s.product} size={18} />
              <span className="stack-actions-name">
                {s.product.name}
                {best && <BestLabel margin={certainty.margin} />}
                {winner && <Contender margin={certainty.margin} s={s} winner={winner} />}
                {!s.cost.eligible && <span className="out-label">Can't serve {team}</span>}
              </span>
              <Visit product={s.product} placement="stack" variant={best ? 'solid' : 'quiet'} note={s.cost.eligible ? undefined : unservable(s)} />
            </li>
          )
        })}
      </ul>
      <ol className="stack-key" aria-label="Your picks">
        {picked.map((s, i) => (
          <li key={s.product.id} data-best={s.product.id === winnerId || undefined}>
            <span className="slot-n" aria-hidden="true">{i + 1}</span>
            <Mark product={s.product} size={18} />
            <span className="stack-key-name">{s.product.name}</span>
            {s.product.id === winnerId && <BestLabel margin={certainty.margin} short />}
            {winner && <Contender margin={certainty.margin} s={s} winner={winner} short />}
          </li>
        ))}
      </ol>
      {groups.map(({ g, rows }) => {
        const standing = groupStanding(g, picked, winner)
        return (
          <section key={g.key} className="sgroup" aria-labelledby={`s-${g.key}`}>
            <h3 id={`s-${g.key}`} tabIndex={-1}>{g.title}</h3>
            {standing && <p className="m-group-leader">{standing}</p>}
            {rows.length === 0 && <p className="m-group-empty">{emptyNote(g, picked)}</p>}
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
                      <li key={s.product.id} data-best={s.product.id === winnerId || undefined} data-top={best.has(s.product.id) || undefined}>
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

/**
 * "Best overall", then how far ahead on its own full-width line when the lead is narrow or a tie-break.
 * short: the phone's sticky key, "Best · tied" on one line, read out in full.
 */
function BestLabel({ margin, short }: { margin: Margin | null; short?: boolean }) {
  if (short) {
    const q = keyQualifier(margin)
    return (
      <span className="best-label">
        <BestGlyph /><span className="best-text">Best</span>
        <span className="sr-only"> overall{q ? `, ${q.spoken}` : ''}</span>
        {q && <span className="key-qual" aria-hidden="true">· {q.shown}</span>}
      </span>
    )
  }
  const qual = winnerQualifier(margin)
  return (
    <>
      <span className="best-label"><BestGlyph />Best overall</span>
      {qual && <span className="best-qual"><span className="sr-only">, </span>{qual}</span>}
    </>
  )
}

/** A pick level with the winner or within the narrow band: plain text, no winner colour. */
function Contender({ margin, s, winner, short }: { margin: Margin | null; s: Scored; winner: Scored; short?: boolean }) {
  if (s === winner) return null
  if (short) {
    const k = keyContender(margin, s, winner)
    return k ? <span className="contender-tag"><span aria-hidden="true">{k.shown}</span><span className="sr-only">{k.spoken}</span></span> : null
  }
  const tag = contenderTag(margin, s, winner)
  return tag ? <span className="contender-tag">{tag}</span> : null
}

function BestGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 1l1.5 3.2 3.5.4-2.6 2.4.7 3.5L6 8.8 2.9 10.5l.7-3.5L1 4.6l3.5-.4z" fill="currentColor" />
    </svg>
  )
}

function EmptyState({ scores, onSelect }: { scores: Map<string, Scored>; onSelect: Props['onSelect'] }) {
  const top = topEligible(scores, 3)
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
          {top.length >= 2 && (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => onSelect(top.map((s) => s.product.id), `Added the top three by score: ${top.map((s) => s.product.name).join(', ')}.`, 'compare-title', 'top-three')}
            >
              Try the top three by score
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function OneState({ only, scores, ids, team, onSelect }: {
  only: Scored; scores: Map<string, Scored>; ids: string[]; team: number; onSelect: Props['onSelect']
}) {
  // without a score there is no "closest on score": suggest the best that can serve the team instead
  const eligible = only.cost.eligible
  const near = eligible ? nearestBy(only.product.id, scores, 3) : topEligible(scores, 3, ids)
  return (
    <div className="state state-one">
      <h3>{only.product.name} is in. Add at least one more to compare.</h3>
      {eligible ? (
        <p>
          A comparison needs two products. {only.product.name} scores {only.overall} for a team of {team}.
          These are the closest to it on score:
        </p>
      ) : (
        <p>
          A comparison needs two products. {only.product.name} can't serve a team of {team}: it {unservable(only)}, so it is not scored.
          These score highest for a team of {team}:
        </p>
      )}
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
              onClick={() => onSelect([...ids, s.product.id], `${s.product.name} added to the comparison. ${ids.length + 1} of 4 selected.`, 'compare-title', 'suggestion')}
            >
              Add<span className="sr-only"> {s.product.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

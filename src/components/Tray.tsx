import { PRODUCT_BY_ID } from '../data/products.ts'
import { MAX_SELECTED } from '../lib/selection.ts'
import { Mark } from './Mark.tsx'
import { track } from '../lib/track.ts'

/** Scroll to the head-to-head and move focus to its heading. */
export function jumpToCompare(e: React.MouseEvent) {
  const target = document.getElementById('compare')
  const heading = document.getElementById('compare-title')
  if (!target || !heading) return
  e.preventDefault()
  track({ event: 'comparison_started', trigger: 'tray' })
  if (window.location.hash !== '#compare') {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#compare`)
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  heading.focus({ preventScroll: true })
}

interface Props {
  ids: string[]
  blocked: string | null
  onReplace: (outgoing: string) => void
  onKeep: () => void
  onRemove: (id: string, focusTarget: string) => void
  onClear: () => void
}

const nameOf = (id: string) => PRODUCT_BY_ID.get(id)?.name ?? id

/** The four-slot tray pinned to the bottom of the ledger: selection state is always in view. */
export function Tray({ ids, blocked, onReplace, onKeep, onRemove, onClear }: Props) {
  const n = ids.length
  const slots = Array.from({ length: MAX_SELECTED }, (_, i) => ids[i])

  return (
    <div className="tray-dock" data-empty={n === 0 || undefined}>
      <div className="tray" role="region" aria-label="Your comparison" data-count={n}>
        {blocked && (
          <div className="tray-full" id="tray-full" tabIndex={-1} role="group" aria-labelledby="tray-full-msg">
            <p id="tray-full-msg">
              <strong>Your comparison is full.</strong> Which one should {nameOf(blocked)} replace?
            </p>
            <div className="tray-full-actions">
              {ids.map((id) => (
                <button key={id} type="button" className="btn btn-quiet" onClick={() => onReplace(id)}>
                  <span className="sr-only">Replace </span>{nameOf(id)}<span className="sr-only"> with {nameOf(blocked)}</span>
                </button>
              ))}
              <button type="button" className="btn btn-link" onClick={onKeep}>Keep these four</button>
            </div>
          </div>
        )}

        <div className="tray-main">
          <p className="tray-count" id="tray-count" tabIndex={-1}>
            <strong>{n} of {MAX_SELECTED}</strong> <span className="tray-count-word" aria-hidden="true">{n === MAX_SELECTED ? 'selected, tray full' : 'selected'}</span><span className="sr-only">{n === MAX_SELECTED ? ' selected, tray full' : ' selected'}</span>
          </p>

          <ol className="slots" aria-label="Comparison slots">
            {slots.map((id, i) => {
              const p = id ? PRODUCT_BY_ID.get(id) : undefined
              return p ? (
                <li key={i} className="slot slot-filled">
                  <span className="slot-n" aria-hidden="true">{i + 1}</span>
                  <Mark product={p} size={18} />
                  <span className="slot-name">{p.name}</span>
                  <button type="button" className="slot-x" onClick={() => onRemove(p.id, 'tray-count')} aria-label={`Remove ${p.name} from the comparison`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.75" /></svg>
                  </button>
                </li>
              ) : (
                <li key={i} className="slot slot-empty">
                  <span className="slot-n" aria-hidden="true">{i + 1}</span>
                  <span className="slot-name">Empty<span className="sr-only"> slot {i + 1}</span></span>
                </li>
              )
            })}
          </ol>

          <div className="tray-actions">
            {n >= 2 && (
              <a className="btn btn-primary" href="#compare" onClick={jumpToCompare}>
                Compare {n}
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M7 2v9M3 7.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
              </a>
            )}
            {n === 1 && (
              <p className="tray-hint">
                Tick one more. <a href="#compare" onClick={jumpToCompare}>See alternatives</a>
              </p>
            )}
            {n === 0 && <p className="tray-hint">Tick up to four to compare.</p>}
            {n > 0 && <button type="button" className="btn btn-link" onClick={onClear}>Clear all</button>}
          </div>
        </div>
        <p id="tray-full-hint" hidden>Your comparison is full. Ticking this product offers to replace one of the four.</p>
      </div>
    </div>
  )
}

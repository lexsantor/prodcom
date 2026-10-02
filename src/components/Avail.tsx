import type { Avail as AvailValue } from '../data/products.ts'
import { level, note } from '../lib/score.ts'

const GLYPH = {
  2: <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />,
  1: <><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 2.75a5.25 5.25 0 0 1 0 10.5z" fill="currentColor" /></>,
  0: <path d="M4 8h8" stroke="currentColor" strokeWidth="2" />,
} as const

/** Plain-text form of a feature value, used for "differences only" comparison. */
export function availText(a: AvailValue): string {
  const l = level(a)
  const n = note(a)
  if (l === 0) return 'Not offered'
  if (l === 1) return n ? `Limited: ${n}` : 'Limited'
  return n ?? 'Included'
}

/** A feature value: glyph plus words, so state never rests on the glyph or color alone. */
export function Avail({ value }: { value: AvailValue }) {
  const l = level(value)
  const n = note(value)
  return (
    <span className={`avail avail-${l}`}>
      <svg className="avail-glyph" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {GLYPH[l]}
      </svg>
      <span>
        {l === 1 && <span className="avail-word">{n ? 'Limited: ' : 'Limited'}</span>}
        {l === 0 ? 'Not offered' : n ?? (l === 2 ? 'Included' : '')}
      </span>
    </span>
  )
}

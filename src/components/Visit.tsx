import type { Product } from '../data/products.ts'
import { hostOf, track, type Placement } from '../lib/track.ts'

/**
 * Outbound link to the vendor. Demo products live on the reserved `.example` TLD.
 * `placement` is passed as utm_content so outbound clicks can be attributed per surface.
 */
export function visitUrl(product: Product, placement: Placement): string {
  return `https://${product.id}.example/?utm_source=prodcom&utm_medium=compare&utm_content=${placement}`
}

interface VisitProps {
  product: Product
  placement: Placement
  variant?: 'solid' | 'quiet'
  /** visible text; defaults to "Visit" with the product name for screen readers */
  label?: string
  /** context added to the accessible name, e.g. why the product cannot serve the team */
  note?: string
  /** 1-based row position in the table as displayed; table placements only */
  displayPosition?: number
}

export function Visit({ product, placement, variant = 'solid', label, note, displayPosition }: VisitProps) {
  const href = visitUrl(product, placement)
  const display_position = displayPosition ?? null
  return (
    <a
      className={`visit visit-${variant}`}
      href={href}
      onClick={() => track({ event: 'product_cta_clicked', product_id: product.id, placement, destination_host: hostOf(href), display_position })}
      target="_blank"
      rel="sponsored noopener"
      data-visit={product.id}
    >
      {label ?? <>Visit<span className="sr-only"> {product.name}{note && `, ${note}`}</span></>}
      {label && note && <span className="sr-only">, {note}</span>}
      <ExternalIcon />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function ExternalIcon() {
  return (
    <svg className="visit-icon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M5 2.5h6.5V9M11.5 2.5 3 11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

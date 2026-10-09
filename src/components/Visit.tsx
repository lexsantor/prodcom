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
}

export function Visit({ product, placement, variant = 'solid', label }: VisitProps) {
  const href = visitUrl(product, placement)
  return (
    <a
      className={`visit visit-${variant}`}
      href={href}
      onClick={() => track({ event: 'product_cta_clicked', product_id: product.id, placement, destination_host: hostOf(href) })}
      target="_blank"
      rel="sponsored noopener"
      data-visit={product.id}
    >
      {label ?? <>Visit<span className="sr-only"> {product.name}</span></>}
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

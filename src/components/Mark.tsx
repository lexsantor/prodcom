import type { Product } from '../data/products.ts'

const SHAPES: Record<Product['mark']['shape'], React.ReactNode> = {
  circle: <circle cx="10" cy="10" r="5.5" />,
  square: <rect x="5" y="5" width="10" height="10" />,
  triangle: <path d="M10 4.5 16 15.5H4z" />,
  diamond: <path d="M10 3.5 16.5 10 10 16.5 3.5 10z" />,
  ring: <path fillRule="evenodd" d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  bars: <path d="M4.5 11h3v5h-3zM8.5 7h3v9h-3zM12.5 4h3v12h-3z" />,
  half: <path d="M10 4a6 6 0 0 1 0 12z M4 9.25h4.5v1.5H4z" />,
  plus: <path d="M8.25 4h3.5v4.25H16v3.5h-4.25V16h-3.5v-4.25H4v-3.5h4.25z" />,
  chevron: <path d="M4 5h5l5 5-5 5H4l5-5z" />,
  hex: <path d="M10 3.5 15.6 6.75v6.5L10 16.5l-5.6-3.25v-6.5z" />,
}

/** Abstract demo brand mark. Decorative: every use has the product name beside it, visibly or as sr-only text. */
export function Mark({ product, size = 20 }: { product: Product; size?: number }) {
  const { shape, hue } = product.mark
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      style={{ '--mark-hue': hue } as React.CSSProperties}
    >
      <rect className="mark-tile" width="20" height="20" rx="4" />
      <g className="mark-glyph">{SHAPES[shape]}</g>
    </svg>
  )
}

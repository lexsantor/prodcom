/** Prodcom mark: two bars of unequal height set against a shared baseline. */
export function Logo() {
  return (
    <svg className="logo" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect x="5" y="9" width="7" height="14" rx="1.5" className="logo-a" />
      <rect x="16" y="4" width="7" height="19" rx="1.5" className="logo-b" />
      <rect x="3" y="23" width="22" height="2" rx="1" className="logo-base" />
    </svg>
  )
}

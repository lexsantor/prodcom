/** Scroll to and focus the first of `ids` that is rendered. The table and the phone stacks both exist in the DOM. */
export function focusVisible(...ids: string[]) {
  requestAnimationFrame(() => {
    const el = ids.map((id) => document.getElementById(id)).find((e) => e && e.offsetParent !== null)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    el?.focus({ preventScroll: true })
  })
}

/** Back to the table: focus the first visible ticked checkbox, else the table heading. */
export function focusLedger() {
  requestAnimationFrame(() => {
    const pick = [...document.querySelectorAll<HTMLInputElement>('input[data-pick]:checked')].find((b) => b.offsetParent !== null)
    const el = pick ?? document.getElementById('ledger-title')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    el?.focus({ preventScroll: true })
  })
}

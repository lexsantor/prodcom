import { useEffect, useMemo, useRef, useState } from 'react'
import { PRODUCT_BY_ID } from './data/products.ts'
import { TEAM_DEFAULT, costFor, scoreCatalog } from './lib/score.ts'
import { MAX_SELECTED, parseCompare, parseTeam, replace, toggle } from './lib/selection.ts'
import { Ledger } from './components/Ledger.tsx'
import { HeadToHead } from './components/HeadToHead.tsx'
import { Method } from './components/Method.tsx'
import { Logo } from './components/Logo.tsx'
import { focusLedger } from './lib/focus.ts'
import { setTrackContext, track } from './lib/track.ts'
import { Related } from './components/Related.tsx'
import { EmailList } from './components/EmailList.tsx'

const nameOf = (id: string) => PRODUCT_BY_ID.get(id)?.name ?? id

/** Focus the visible selection checkbox for a product (the ledger has a table and a list layout). */
export function focusPick(id: string) {
  requestAnimationFrame(() => {
    const boxes = document.querySelectorAll<HTMLInputElement>(`input[data-pick="${id}"]`)
    const visible = [...boxes].find((b) => b.offsetParent !== null)
    visible?.focus()
  })
}

export function focusById(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: false }))
}

/** Picks whose ability to serve the team changes between two team sizes, said aloud; picks are never removed. */
function eligibilityChanges(ids: readonly string[], from: number, to: number): string[] {
  return ids.flatMap((id) => {
    const p = PRODUCT_BY_ID.get(id)
    if (!p) return []
    const was = costFor(p, from).eligible
    const is = costFor(p, to).eligible
    if (was === is) return []
    return [is ? `${p.name} can serve ${to} again and is back in the verdict.` : `${p.name} can't serve ${to} and is left out of the verdict.`]
  })
}

export function App() {
  const [ids, setIds] = useState<string[]>([])
  const [team, setTeam] = useState(TEAM_DEFAULT)
  /** the product a user tried to add while the comparison was full */
  const [blocked, setBlocked] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [restored, setRestored] = useState(false)
  const scores = useMemo(() => scoreCatalog(team), [team])

  // Prerendered HTML is the default state; the URL is applied after hydration.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const restoredIds = parseCompare(q.get('compare'))
    const restoredTeam = parseTeam(q.get('team'))
    setIds(restoredIds)
    setTeam(restoredTeam)
    setRestored(true)
    setTrackContext({ selected_ids: restoredIds, team_size: restoredTeam })
    track({ event: 'comparison_page_viewed', from_shared_link: restoredIds.length > 0 })
  }, [])

  useEffect(() => setTrackContext({ selected_ids: ids, team_size: team }), [ids, team])

  // One team_size_changed per adjustment: typing "25" or holding the stepper settles into one event.
  const teamBurst = useRef<{ from: number; timer?: number }>({ from: TEAM_DEFAULT })
  useEffect(() => () => window.clearTimeout(teamBurst.current.timer), [])

  useEffect(() => {
    if (!restored) return
    const q = new URLSearchParams(window.location.search)
    if (ids.length) q.set('compare', ids.join(','))
    else q.delete('compare')
    if (team !== TEAM_DEFAULT) q.set('team', String(team))
    else q.delete('team')
    const query = q.toString().replace(/%2C/g, ',') // readable shared links
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [ids, team, restored])

  // Back after "Compare N" returns to the table and the first pick, not off the site.
  useEffect(() => {
    let wasAtCompare = window.location.hash === '#compare'

    function onClick(event: MouseEvent) {
      const target = event.target
      if (target instanceof Element && target.closest('a[href="#compare"]')) {
        wasAtCompare = true
      }
    }

    function onPopState() {
      if (window.location.hash === '#compare') {
        wasAtCompare = true
        return
      }
      if (!wasAtCompare) return
      wasAtCompare = false
      focusLedger()
    }

    window.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  const say = (text: string) => setAnnouncement(text)

  function onToggle(id: string, displayPosition?: number) {
    const result = toggle(ids, id)
    if (result.kind === 'full') {
      track({ event: 'comparison_full_blocked', product_id: id })
      setBlocked(id)
      focusById('tray-full')
      return
    }
    setBlocked(null)
    setIds(result.ids)
    setTrackContext({ selected_ids: result.ids })
    track(result.kind === 'added'
      ? { event: 'product_selected', product_id: id, slot: result.ids.indexOf(id) + 1, source: 'ledger', display_position: displayPosition ?? null }
      : { event: 'product_deselected', product_id: id, source: 'ledger' })
    say(`${nameOf(id)} ${result.kind === 'added' ? 'added to' : 'removed from'} the comparison. ${result.ids.length} of ${MAX_SELECTED} selected.`)
  }

  function onReplace(outgoing: string) {
    if (!blocked) return
    const next = replace(ids, outgoing, blocked)
    setIds(next)
    setTrackContext({ selected_ids: next })
    track({ event: 'product_deselected', product_id: outgoing, source: 'replace' })
    track({ event: 'product_selected', product_id: blocked, slot: next.indexOf(blocked) + 1, source: 'replace' })
    say(`${nameOf(outgoing)} replaced by ${nameOf(blocked)}. ${ids.length} of ${MAX_SELECTED} selected.`)
    focusPick(blocked)
    setBlocked(null)
  }

  function onKeep() {
    if (blocked) focusPick(blocked)
    setBlocked(null)
  }

  function onRemove(id: string, focusTarget: string) {
    const next = ids.filter((x) => x !== id)
    setIds(next)
    setTrackContext({ selected_ids: next })
    track({ event: 'product_deselected', product_id: id, source: focusTarget === 'tray-count' ? 'tray' : 'matrix' })
    setBlocked(null)
    say(`${nameOf(id)} removed from the comparison. ${next.length} of ${MAX_SELECTED} selected.`)
    focusById(focusTarget)
  }

  function onSelect(next: string[], message: string, focusTarget?: string, source: 'clear' | 'suggestion' | 'top-three' = 'clear') {
    const capped = next.slice(0, MAX_SELECTED)
    setIds(capped)
    setTrackContext({ selected_ids: capped })
    for (const id of ids.filter((x) => !capped.includes(x))) track({ event: 'product_deselected', product_id: id, source: 'clear' })
    if (source !== 'clear') {
      for (const id of capped.filter((x) => !ids.includes(x))) track({ event: 'product_selected', product_id: id, slot: capped.indexOf(id) + 1, source })
    }
    setBlocked(null)
    say(message)
    if (focusTarget) focusById(focusTarget)
  }

  function onTeam(n: number) {
    const burst = teamBurst.current
    if (burst.timer === undefined) burst.from = team
    window.clearTimeout(burst.timer)
    burst.timer = window.setTimeout(() => {
      burst.timer = undefined
      if (burst.from !== n) track({ event: 'team_size_changed', from: burst.from, to: n })
    }, 1000)
    setTeam(n)
    setTrackContext({ team_size: n })
    say([`Prices and scores updated for a team of ${n}.`, ...eligibilityChanges(ids, team, n)].join(' '))
  }

  return (
    <>
      <a className="skip" href="#ledger">Skip to the comparison table</a>
      <header className="masthead" id="top">
        <div className="wrap">
          <div className="masthead-bar">
            <a className="wordmark" href="./" aria-label="Prodcom home">
              <Logo />
              <span aria-hidden="true">prodcom</span>
            </a>
            <p className="demo-flag">
              Demo: every product and figure here is fictional. Visit links are affiliate links; they never change a score. <a href="#method">About the data</a>
            </p>
          </div>
          <h1>Compare project-management tools side by side, priced for your team.</h1>
          <p className="lede">
            Ten tools in one table. Tick up to four, and Prodcom lines them up attribute by attribute,
            names a best overall, and shows where each of the others is stronger.
          </p>
          <ol className="steps" aria-label="How it works">
            <li><span className="step-n" aria-hidden="true">1</span>Scan all ten</li>
            <li><span className="step-n" aria-hidden="true">2</span>Tick up to four</li>
            <li><span className="step-n" aria-hidden="true">3</span>Read the head-to-head</li>
          </ol>
        </div>
      </header>

      <main>
        <Ledger
          scores={scores}
          ids={ids}
          team={team}
          blocked={blocked}
          onTeam={onTeam}
          onToggle={onToggle}
          onReplace={onReplace}
          onKeep={onKeep}
          onRemove={onRemove}
          onClear={() => onSelect([], 'Comparison cleared. 0 of 4 selected.', 'tray-count')}
        />
        <HeadToHead
          scores={scores}
          ids={ids}
          team={team}
          onRemove={onRemove}
          onSelect={onSelect}
          onAnnounce={say}
        />
        <Related />
        <EmailList ids={ids} team={team} />
        <Method />
      </main>

      <footer className="footer">
        <div className="wrap">
          <p>
            Prodcom is a fictional product built to demonstrate a software comparison experience.
            All ten products, and every price, rating, review count and feature on this page, are invented
            demo data. Any resemblance to real software is coincidental.
          </p>
          <a href="#top" className="footer-top">Back to top</a>
        </div>
      </footer>

      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </>
  )
}

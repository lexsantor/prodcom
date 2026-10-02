import { useEffect, useMemo, useState } from 'react'
import { PRODUCT_BY_ID } from './data/products.ts'
import { TEAM_DEFAULT, scoreCatalog } from './lib/score.ts'
import { MAX_SELECTED, parseCompare, parseTeam, replace, toggle } from './lib/selection.ts'
import { Ledger } from './components/Ledger.tsx'
import { HeadToHead } from './components/HeadToHead.tsx'
import { Method } from './components/Method.tsx'
import { Logo } from './components/Logo.tsx'

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
    setIds(parseCompare(q.get('compare')))
    setTeam(parseTeam(q.get('team')))
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    const q = new URLSearchParams(window.location.search)
    if (ids.length) q.set('compare', ids.join(','))
    else q.delete('compare')
    if (team !== TEAM_DEFAULT) q.set('team', String(team))
    else q.delete('team')
    const query = q.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [ids, team, restored])

  const say = (text: string) => setAnnouncement(text)

  function onToggle(id: string) {
    const result = toggle(ids, id)
    if (result.kind === 'full') {
      setBlocked(id)
      focusById('tray-full')
      return
    }
    setBlocked(null)
    setIds(result.ids)
    say(`${nameOf(id)} ${result.kind === 'added' ? 'added to' : 'removed from'} the comparison. ${result.ids.length} of ${MAX_SELECTED} selected.`)
  }

  function onReplace(outgoing: string) {
    if (!blocked) return
    setIds(replace(ids, outgoing, blocked))
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
    setBlocked(null)
    say(`${nameOf(id)} removed from the comparison. ${next.length} of ${MAX_SELECTED} selected.`)
    focusById(focusTarget)
  }

  function onSelect(next: string[], message: string) {
    setIds(next.slice(0, MAX_SELECTED))
    setBlocked(null)
    say(message)
  }

  function onTeam(n: number) {
    setTeam(n)
    say(`Prices and scores updated for a team of ${n}.`)
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
              Demo: every product and figure here is fictional. <a href="#method">About the data</a>
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
          onClear={() => onSelect([], 'Comparison cleared. 0 of 4 selected.')}
        />
        <HeadToHead
          scores={scores}
          ids={ids}
          team={team}
          onRemove={onRemove}
          onSelect={onSelect}
          onAnnounce={say}
        />
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

import { Fragment, useMemo, useState } from 'react'
import type { Product } from '../data/products.ts'
import { adminCoverage, coreCoverage, usd, type Coverage, type Scored } from '../lib/score.ts'
import { MAX_SELECTED } from '../lib/selection.ts'
import { Mark } from './Mark.tsx'
import { TeamSize } from './TeamSize.tsx'
import { Tray } from './Tray.tsx'

type SortKey = 'score' | 'price' | 'rating' | 'features' | 'name'

const SORTS: Record<SortKey, { label: string; dir: 'ascending' | 'descending'; cmp: (a: Scored, b: Scored) => number }> = {
  score: { label: 'Score, highest first', dir: 'descending', cmp: (a, b) => b.overall - a.overall },
  price: {
    label: 'Price, lowest first',
    dir: 'ascending',
    cmp: (a, b) => Number(b.cost.eligible) - Number(a.cost.eligible) || a.cost.total - b.cost.total,
  },
  rating: { label: 'Rating, highest first', dir: 'descending', cmp: (a, b) => b.product.rating - a.product.rating },
  features: { label: 'Features, most first', dir: 'descending', cmp: (a, b) => b.areas.capability - a.areas.capability },
  name: { label: 'Name, A to Z', dir: 'ascending', cmp: (a, b) => a.product.name.localeCompare(b.product.name) },
}

const CURVE_LABEL = { gentle: 'Gentle to learn', moderate: 'Moderate to learn', steep: 'Steep to learn' } as const

interface Props {
  scores: Map<string, Scored>
  ids: string[]
  team: number
  blocked: string | null
  onTeam: (n: number) => void
  onToggle: (id: string) => void
  onReplace: (outgoing: string) => void
  onKeep: () => void
  onRemove: (id: string, focusTarget: string) => void
  onClear: () => void
}

export function Ledger(props: Props) {
  const { scores, ids, team, onToggle } = props
  const [sort, setSort] = useState<SortKey>('score')
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const rows = useMemo(() => [...scores.values()].sort((a, b) => SORTS[sort].cmp(a, b) || b.overall - a.overall), [scores, sort])
  const full = ids.length >= MAX_SELECTED

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const sortHeader = (key: SortKey, label: string, className = '') => (
    <th scope="col" className={className} aria-sort={sort === key ? SORTS[key].dir : undefined}>
      <button type="button" className="sort" onClick={() => setSort(key)}>
        {label}
        <SortGlyph active={sort === key} dir={SORTS[key].dir} />
      </button>
    </th>
  )

  return (
    <section className="ledger" id="ledger" aria-labelledby="ledger-title">
      <div className="wrap">
        <div className="ledger-head">
          <div>
            <h2 id="ledger-title">All ten tools</h2>
            <p className="section-sub">
              Prices are per month for your whole team, billed yearly. Tick a product to add it to your comparison.
            </p>
          </div>
          <div className="controls">
            <TeamSize team={team} onTeam={props.onTeam} />
            <label className="sort-select">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <table className="ledger-table">
          <caption className="sr-only">
            Ten fictional project-management tools, priced for a team of {team}, sorted by {SORTS[sort].label.toLowerCase()}.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="col-pick">Compare</th>
              {sortHeader('name', 'Product', 'col-product')}
              {sortHeader('score', 'Score', 'col-num')}
              {sortHeader('price', `Price for ${team}`, 'col-price')}
              {sortHeader('rating', 'Rating', 'col-rating')}
              {sortHeader('features', 'Core features', 'col-features')}
              <th scope="col" className="col-adopt">Adoption and support</th>
              <th scope="col" className="col-more"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const p = s.product
              const slot = ids.indexOf(p.id)
              const isOpen = open.has(p.id)
              return (
                <Fragment key={p.id}>
                  <tr className="lrow" data-selected={slot >= 0 || undefined}>
                    <td className="col-pick">
                      <Pick product={p} slot={slot} full={full} onToggle={onToggle} variant="table" />
                    </td>
                    <th scope="row" className="col-product">
                      <ProductName product={p} />
                    </th>
                    <td className="col-num"><span className="score">{s.overall}</span></td>
                    <td className="col-price"><Price s={s} team={team} /></td>
                    <td className="col-rating"><Rating product={p} /></td>
                    <td className="col-features"><CoverageBar c={coreCoverage(p)} /></td>
                    <td className="col-adopt">
                      <span className="line">{CURVE_LABEL[p.onboarding.curve]}</span>
                      <span className="line muted small">Support {p.support.response.toLowerCase()}</span>
                    </td>
                    <td className="col-more">
                      <button
                        type="button"
                        className="more"
                        aria-expanded={isOpen}
                        aria-controls={`details-${p.id}`}
                        onClick={() => toggleOpen(p.id)}
                      >
                        Details<span className="sr-only"> for {p.name}</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="ldetails" id={`details-${p.id}`} hidden={!isOpen} data-selected={slot >= 0 || undefined}>
                    <td colSpan={8}><Details product={p} /></td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>

        <ul className="ledger-list" aria-label={`Ten fictional project-management tools, priced for a team of ${team}`}>
          {rows.map((s) => {
            const p = s.product
            const slot = ids.indexOf(p.id)
            return (
              <li key={p.id} className="lcard" data-selected={slot >= 0 || undefined}>
                <div className="lcard-top">
                  <ProductName product={p} heading />
                  <p className="lcard-score"><span className="score">{s.overall}</span><span className="muted"> / 100</span><span className="sr-only"> score</span></p>
                </div>
                <dl className="facts">
                  <div><dt>Price for {team}</dt><dd><Price s={s} team={team} /></dd></div>
                  <div><dt>Rating</dt><dd><Rating product={p} /></dd></div>
                  <div><dt>Core features</dt><dd><CoverageBar c={coreCoverage(p)} /></dd></div>
                  <div>
                    <dt>Adoption</dt>
                    <dd>
                      <span className="line">{CURVE_LABEL[p.onboarding.curve]}</span>
                      <span className="line muted small">Support {p.support.response.toLowerCase()}</span>
                    </dd>
                  </div>
                </dl>
                <div className="lcard-actions">
                  <Pick product={p} slot={slot} full={full} onToggle={onToggle} variant="list" />
                  <details className="lcard-more">
                    <summary>Details<span className="sr-only"> for {p.name}</span></summary>
                    <Details product={p} />
                  </details>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Tray
        ids={ids}
        blocked={props.blocked}
        onReplace={props.onReplace}
        onKeep={props.onKeep}
        onRemove={props.onRemove}
        onClear={props.onClear}
      />
    </section>
  )
}

function SortGlyph({ active, dir }: { active: boolean; dir: 'ascending' | 'descending' }) {
  return (
    <svg className="sort-glyph" data-active={active || undefined} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d={dir === 'descending' ? 'M1 3h8L5 8z' : 'M1 7h8L5 2z'} fill="currentColor" />
    </svg>
  )
}

interface PickProps {
  product: Product
  slot: number
  full: boolean
  onToggle: (id: string) => void
  variant: 'table' | 'list'
}

/** The selection control: a native checkbox, so mouse, touch, Space and screen readers all work. */
function Pick({ product, slot, full, onToggle, variant }: PickProps) {
  const checked = slot >= 0
  const id = `pick-${variant}-${product.id}`
  return (
    <label className={`pick pick-${variant}`} htmlFor={id} data-checked={checked || undefined}>
      <input
        id={id}
        type="checkbox"
        data-pick={product.id}
        checked={checked}
        onChange={() => onToggle(product.id)}
        aria-describedby={!checked && full ? 'tray-full-hint' : undefined}
      />
      <span className="pick-box" aria-hidden="true">
        {checked ? slot + 1 : null}
      </span>
      <span className="sr-only">Compare {product.name}</span>
      {variant === 'list' && (
        <span className="pick-text" aria-hidden="true">
          {checked ? `In comparison, slot ${slot + 1}` : 'Add to comparison'}
        </span>
      )}
    </label>
  )
}

function ProductName({ product, heading = false }: { product: Product; heading?: boolean }) {
  const Name = heading ? 'h3' : 'span'
  return (
    <span className="pname">
      <Mark product={product} size={24} />
      <span className="pname-text">
        <Name className="pname-name">{product.name}</Name>
        <span className="pname-for">{product.bestFor}</span>
      </span>
    </span>
  )
}

export function Price({ s, team }: { s: Scored; team: number }) {
  const { cost, product } = s
  if (!cost.eligible) {
    return (
      <span className="price price-out">
        <span className="line warn">Not available for {team}</span>
        <span className="line muted">{cost.reason}</span>
      </span>
    )
  }
  const pr = product.pricing
  const extra = pr.freePlan ? 'Free plan' : pr.trialDays ? `${pr.trialDays}-day trial` : 'No free plan or trial'
  return (
    <span className="price">
      <span className="line"><span className="price-total">{usd(cost.total)}</span><span className="muted"> /mo</span></span>
      <span className="line muted small">{cost.arithmetic}</span>
      <span className="line muted small">{extra}</span>
    </span>
  )
}

function Rating({ product }: { product: Product }) {
  return (
    <span className="rating">
      <span className="line"><span className="rating-n">{product.rating.toFixed(1)}</span><span className="muted"> / 5</span></span>
      <span className="line muted small">{product.reviews.toLocaleString('en-US')} demo reviews</span>
    </span>
  )
}

export function CoverageBar({ c }: { c: Coverage }) {
  const cells = Array.from({ length: c.total }, (_, i) => (i < c.full ? 2 : i < c.full + c.limited ? 1 : 0))
  return (
    <span className="coverage">
      <span className="coverage-bar" aria-hidden="true">
        {cells.map((l, i) => <span key={i} className={`cell cell-${l}`} />)}
      </span>
      <span className="line small">
        {c.full} of {c.total} included{c.limited ? `, ${c.limited} limited` : ''}
      </span>
    </span>
  )
}

function Details({ product }: { product: Product }) {
  const admin = adminCoverage(product)
  return (
    <div className="details">
      <p className="details-tag">{product.tagline}</p>
      <div className="details-cols">
        <div>
          <h4>Strengths</h4>
          <ul>{product.strengths.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div>
          <h4>Limitations</h4>
          <ul>{product.limitations.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div>
          <h4>At a glance</h4>
          <ul className="plain">
            <li>Admin and security: {admin.full} of {admin.total} included{admin.limited ? `, ${admin.limited} limited` : ''}</li>
            <li>{product.integrations} integrations</li>
            <li>Apps: web{product.platforms.desktop ? `, ${product.platforms.desktop}` : ''}, {product.platforms.mobile}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Analytics contract v1 (docs/analytics/tracking-plan.md).
// Vendor-neutral: events are pushed to `window.dataLayer`; the tag manager and the site's consent
// platform decide what, if anything, leaves the browser. This module stores nothing (no cookies,
// no storage), makes no network requests and never carries PII, prices paid or margin data.
import { PRODUCT_BY_ID } from '../data/products.ts'

export const SCHEMA_VERSION = 1

export type Placement = 'ledger' | 'ledger-card' | 'verdict' | 'matrix'
export type ComparisonView = 'key' | 'essential' | 'all'

export type TrackEvent =
  | { event: 'comparison_page_viewed'; from_shared_link: boolean }
  | { event: 'team_size_changed'; from: number; to: number }
  | { event: 'product_selected'; product_id: string; slot: number; source: 'ledger' | 'replace' | 'suggestion' | 'top-three' }
  | { event: 'product_deselected'; product_id: string; source: 'ledger' | 'tray' | 'matrix' | 'replace' | 'clear' }
  | { event: 'comparison_full_blocked'; product_id: string }
  | { event: 'comparison_started'; trigger: 'tray' | 'scroll' }
  | { event: 'comparison_view_changed'; from: ComparisonView; to: ComparisonView; rows: number; trigger: 'control' | 'verdict' }
  | { event: 'product_cta_clicked'; product_id: string; placement: Placement; destination_host: string }
  | { event: 'comparison_shared'; method: 'copy_link' }
  | { event: 'email_capture_submitted'; alerts_opt_in: boolean }

/** Page state every event carries, kept current by the components that own it. */
interface Context {
  team_size: number
  selected_ids: string[]
  winner_id: string | null
  view: ComparisonView | null
}

const context: Context = { team_size: 10, selected_ids: [], winner_id: null, view: null }
// ponytail: module-level context, fine for one page; move to React context if a second page appears.
export function setTrackContext(patch: Partial<Context>) {
  Object.assign(context, patch)
}

/** Random per page load, held in memory only, so events from one view of the page can be joined. */
const pageViewId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2)

const DEDUPE_MS = 800
let last = { key: '', at: 0 }

const knownIds = (e: TrackEvent) =>
  !('product_id' in e) || PRODUCT_BY_ID.has(e.product_id)

/** Builds the payload; exported for tests. Returns null for an invalid event or an accidental repeat. */
export function buildPayload(e: TrackEvent, now = Date.now()) {
  if (!knownIds(e)) return null
  const key = JSON.stringify(e)
  if (key === last.key && now - last.at < DEDUPE_MS) return null // double clicks, re-renders
  last = { key, at: now }
  return {
    ...e,
    schema_version: SCHEMA_VERSION,
    page_view_id: pageViewId,
    ts: new Date(now).toISOString(),
    team_size: context.team_size,
    selected_ids: [...context.selected_ids],
    selected_count: context.selected_ids.length,
    winner_id: context.winner_id,
    comparison_view: context.view,
  }
}

type DataLayerWindow = Window & { dataLayer?: unknown[] }

/** Never throws into the UI: analytics failures must not break the comparison. */
export function track(e: TrackEvent) {
  try {
    const payload = buildPayload(e)
    if (!payload || typeof window === 'undefined') return
    const w = window as DataLayerWindow
    w.dataLayer = w.dataLayer ?? []
    w.dataLayer.push(payload)
  } catch {
    // analytics is best-effort; the page keeps working
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'invalid'
  }
}

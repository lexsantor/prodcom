import { PRODUCT_BY_ID } from '../data/products.ts'
import { TEAM_DEFAULT, TEAM_MAX, TEAM_MIN } from './score.ts'

/** Hard product rule: at most four products in a comparison. */
export const MAX_SELECTED = 4

export type ToggleResult =
  | { kind: 'added' | 'removed'; ids: string[] }
  | { kind: 'full'; ids: string[]; attempted: string }

export function toggle(ids: readonly string[], id: string): ToggleResult {
  if (ids.includes(id)) return { kind: 'removed', ids: ids.filter((x) => x !== id) }
  if (ids.length >= MAX_SELECTED) return { kind: 'full', ids: [...ids], attempted: id }
  return { kind: 'added', ids: [...ids, id] }
}

/** Swap `incoming` into the slot held by `outgoing`, keeping slot order. */
export function replace(ids: readonly string[], outgoing: string, incoming: string): string[] {
  if (!ids.includes(outgoing) || ids.includes(incoming)) return [...ids]
  return ids.map((x) => (x === outgoing ? incoming : x))
}

/** Reads `?compare=` defensively: known ids only, no duplicates, at most four. */
export function parseCompare(raw: string | null): string[] {
  if (!raw) return []
  const ids = raw.split(',').map((s) => s.trim().toLowerCase()).filter((id) => PRODUCT_BY_ID.has(id))
  return [...new Set(ids)].slice(0, MAX_SELECTED)
}

export function clampTeam(n: number): number {
  if (!Number.isFinite(n)) return TEAM_DEFAULT
  return Math.min(TEAM_MAX, Math.max(TEAM_MIN, Math.round(n)))
}

export function parseTeam(raw: string | null): number {
  return raw === null || raw.trim() === '' ? TEAM_DEFAULT : clampTeam(Number(raw))
}

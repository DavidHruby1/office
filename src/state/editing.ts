import type { Vec2 } from '../data/room'
import type { Item } from '../data/types'
import { findConflicts, hasConflict } from '../lib/geometry'
import { useStore } from './store'

export const GRID = 0.1

export function describeConflict(item: Item, all: Item[]) {
  const c = findConflicts(item, all)
  const names = c.items.map((id) => all.find((i) => i.id === id)?.name).filter(Boolean)
  return [c.walls ? 'a wall' : null, ...names].filter(Boolean).join(', ')
}

/**
 * Called by both editors when a move gesture ends: an invalid placement is either reverted to the
 * last collision-free position (default) or kept with a visible warning.
 */
export function settleMove(id: string, lastValid: Vec2) {
  const s = useStore.getState()
  const cur = s.items.find((i) => i.id === id)
  if (!cur || !hasConflict(findConflicts(cur, s.items))) return
  const what = describeConflict(cur, s.items)
  if (s.blockInvalid) {
    s.patchItem(id, lastValid)
    s.notify(`Can't place ${cur.name} there – it would overlap ${what}. Moved back to the last free spot.`)
  } else {
    s.notify(`${cur.name} overlaps ${what}.`)
  }
}

export function warnIfConflict(id: string) {
  const s = useStore.getState()
  const cur = s.items.find((i) => i.id === id)
  if (cur && hasConflict(findConflicts(cur, s.items))) s.notify(`${cur.name} now overlaps ${describeConflict(cur, s.items)}.`)
}

import { WALL_FRAMES, wallDistance, type Vec2 } from '../data/room'
import { isFlat } from '../data/catalog'
import type { Item } from '../data/types'

export type Footprint = Pick<Item, 'x' | 'z' | 'rot' | 'w' | 'd'>

/** local (lx, lz) → world, for a Y-rotation `rot` (same convention as three.js) */
export function toWorld(f: Footprint, lx: number, lz: number): Vec2 {
  const c = Math.cos(f.rot)
  const s = Math.sin(f.rot)
  return { x: f.x + lx * c + lz * s, z: f.z - lx * s + lz * c }
}

export function corners(f: Footprint): Vec2[] {
  const hw = f.w / 2
  const hd = f.d / 2
  return [toWorld(f, -hw, -hd), toWorld(f, hw, -hd), toWorld(f, hw, hd), toWorld(f, -hw, hd)]
}

function axes(f: Footprint): Vec2[] {
  const c = Math.cos(f.rot)
  const s = Math.sin(f.rot)
  return [{ x: c, z: -s }, { x: s, z: c }]
}

/** Separating-axis test for two oriented rectangles. `eps` = tolerated touching overlap. */
export function footprintsOverlap(a: Footprint, b: Footprint, eps = 0.004): boolean {
  const ca = corners(a)
  const cb = corners(b)
  for (const ax of [...axes(a), ...axes(b)]) {
    let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity
    for (const p of ca) { const v = p.x * ax.x + p.z * ax.z; minA = Math.min(minA, v); maxA = Math.max(maxA, v) }
    for (const p of cb) { const v = p.x * ax.x + p.z * ax.z; minB = Math.min(minB, v); maxB = Math.max(maxB, v) }
    if (maxA - eps <= minB || maxB - eps <= minA) return false
  }
  return true
}

export function itemsCollide(a: Item, b: Item): boolean {
  if (isFlat(a.type) || isFlat(b.type)) return false
  // vertical ranges must overlap too (TV above dresser, microwave on fridge …)
  if (a.y + a.h - 0.004 <= b.y || b.y + b.h - 0.004 <= a.y) return false
  return footprintsOverlap(a, b)
}

/** How far the footprint pokes through each wall (0 = fully inside). */
export function wallPenetration(f: Footprint): number {
  let worst = 0
  for (const p of corners(f)) for (const wf of WALL_FRAMES) worst = Math.max(worst, -wallDistance(wf, p))
  return worst
}

export interface Conflicts {
  walls: boolean
  items: string[]
}

export function findConflicts(item: Item, all: Item[]): Conflicts {
  const walls = wallPenetration(item) > 0.006
  const items: string[] = []
  for (const o of all) {
    if (o.id === item.id || o.hidden) continue
    if (itemsCollide(item, o)) items.push(o.id)
  }
  return { walls, items }
}

export const hasConflict = (c: Conflicts) => c.walls || c.items.length > 0

export function allConflicts(items: Item[]): Record<string, Conflicts> {
  const out: Record<string, Conflicts> = {}
  for (const it of items) {
    if (it.hidden) continue
    const c = findConflicts(it, items)
    if (hasConflict(c)) out[it.id] = c
  }
  return out
}

/** Push the footprint out of walls and, when within `threshold`, pull it flush against them. */
export function snapToWalls(f: Footprint, threshold: number, gap = 0.01): Vec2 {
  let x = f.x
  let z = f.z
  for (let pass = 0; pass < 2; pass++) {
    for (const wf of WALL_FRAMES) {
      let min = Infinity
      for (const p of corners({ ...f, x, z })) min = Math.min(min, wallDistance(wf, p))
      if (min < threshold) {
        const shift = gap - min
        x += wf.n.x * shift
        z += wf.n.z * shift
      }
    }
  }
  return { x, z }
}

export interface MoveOptions {
  gridSnap: boolean
  wallSnap: boolean
  grid: number
}

/** Shared by the 2D and 3D editors: apply grid + wall snapping to a requested position. */
export function resolveMove(item: Item, x: number, z: number, o: MoveOptions): Vec2 {
  let p = { x, z }
  if (o.gridSnap) p = { x: Math.round(p.x / o.grid) * o.grid, z: Math.round(p.z / o.grid) * o.grid }
  if (o.wallSnap) p = snapToWalls({ ...item, ...p }, 0.12)
  else p = snapToWalls({ ...item, ...p }, 0, 0) // never through walls, but no magnetism
  return p
}

function raySegment(o: Vec2, d: Vec2, a: Vec2, b: Vec2): number | null {
  const ex = b.x - a.x
  const ez = b.z - a.z
  const den = d.x * ez - d.z * ex
  if (Math.abs(den) < 1e-9) return null
  const t = ((a.x - o.x) * ez - (a.z - o.z) * ex) / den
  const u = ((a.x - o.x) * d.z - (a.z - o.z) * d.x) / den
  if (t < -1e-6 || u < 0 || u > 1) return null
  return Math.max(0, t)
}

export interface Clearance {
  side: 'front' | 'back' | 'left' | 'right'
  dist: number
  from: Vec2
  to: Vec2
  hit: string // 'wall' or the name of the other item
}

/** Free distance from the middle of each side of the item to the nearest wall or furniture. */
export function clearances(item: Item, all: Item[]): Clearance[] {
  const sides: { side: Clearance['side']; lx: number; lz: number; dx: number; dz: number }[] = [
    { side: 'front', lx: 0, lz: item.d / 2, dx: 0, dz: 1 },
    { side: 'back', lx: 0, lz: -item.d / 2, dx: 0, dz: -1 },
    { side: 'right', lx: item.w / 2, lz: 0, dx: 1, dz: 0 },
    { side: 'left', lx: -item.w / 2, lz: 0, dx: -1, dz: 0 },
  ]
  const c = Math.cos(item.rot)
  const s = Math.sin(item.rot)
  return sides.map(({ side, lx, lz, dx, dz }) => {
    const from = toWorld(item, lx, lz)
    const dir = { x: dx * c + dz * s, z: -dx * s + dz * c }
    let best = Infinity
    let hit = 'wall'
    for (const wf of WALL_FRAMES) {
      const t = raySegment(from, dir, wf.wall.a, wf.wall.b)
      if (t !== null && t < best) { best = t; hit = 'wall' }
    }
    for (const o of all) {
      if (o.id === item.id || o.hidden || isFlat(o.type)) continue
      if (item.y + item.h <= o.y || o.y + o.h <= item.y) continue
      const cs = corners(o)
      for (let i = 0; i < 4; i++) {
        const t = raySegment(from, dir, cs[i], cs[(i + 1) % 4])
        if (t !== null && t < best) { best = t; hit = o.name }
      }
    }
    if (!isFinite(best)) best = 0
    return { side, dist: best, from, to: { x: from.x + dir.x * best, z: from.z + dir.z * best }, hit }
  })
}

/** Circle-vs-room test for the first-person walkthrough. */
export function walkBlocked(p: Vec2, radius: number, items: Item[]): boolean {
  for (const wf of WALL_FRAMES) if (wallDistance(wf, p) < radius) return true
  for (const o of items) {
    if (o.hidden || isFlat(o.type)) continue
    if (o.y > 1.75 || o.y + o.h < 0.3) continue
    // point in rectangle expanded by radius (in the item's local frame)
    const dx = p.x - o.x
    const dz = p.z - o.z
    const c = Math.cos(o.rot)
    const s = Math.sin(o.rot)
    const lx = dx * c - dz * s
    const lz = dx * s + dz * c
    if (Math.abs(lx) < o.w / 2 + radius && Math.abs(lz) < o.d / 2 + radius) return true
  }
  return false
}

export const dist2 = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z)
export const cm = (m: number) => `${Math.round(m * 100)} cm`
export const deg = (r: number) => (r * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180
export const normAngle = (r: number) => {
  let a = r % (Math.PI * 2)
  if (a > Math.PI) a -= Math.PI * 2
  if (a <= -Math.PI) a += Math.PI * 2
  return a
}

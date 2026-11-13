/**
 * Permanent architecture of the room. 1 unit = 1 metre.
 *
 * Coordinate system (matches the supplied floor-plan sketch seen from above):
 *   x → along the long straight wall, 0 = kitchen/door wall, 7.20 = bed end wall
 *   z → across the room, 0 = long straight wall (sofa wall), grows toward the window wall
 *   y → up
 *
 * MEASURED (from the sketch):   length 7.20, kitchen wall 2.95, middle width ≈ 2.30
 * ADJUSTED:                     bed end wall 1.72 instead of "cca 160" – the 170 cm wide bed
 *                               stands wall-to-wall there in the photos, so 160 is impossible.
 * ESTIMATED (from photographs): ceiling height, window/door sizes and positions.
 */

export type Vec2 = { x: number; z: number }

export const ROOM = {
  length: 7.2,
  widthKitchenEnd: 2.95,
  widthBedEnd: 1.72,
  ceiling: 2.6,
}

/** Floor polygon, clockwise when seen from above (x right, z down). Convex. */
export const FLOOR_POLY: Vec2[] = [
  { x: 0, z: 0 },
  { x: ROOM.length, z: 0 },
  { x: ROOM.length, z: ROOM.widthBedEnd },
  { x: 0, z: ROOM.widthKitchenEnd },
]

export type Opening = {
  kind: 'window' | 'door'
  /** distance of the opening start from wall point `a`, along the wall */
  t0: number
  t1: number
  y0: number
  y1: number
}

export type Wall = {
  id: string
  label: string
  a: Vec2
  b: Vec2
  openings: Opening[]
}

export const WALLS: Wall[] = [
  { id: 'sofa', label: 'Sofa wall', a: FLOOR_POLY[0], b: FLOOR_POLY[1], openings: [] },
  { id: 'bed', label: 'Bed end wall', a: FLOOR_POLY[1], b: FLOOR_POLY[2], openings: [] },
  {
    id: 'window',
    label: 'Window wall',
    a: FLOOR_POLY[3],
    b: FLOOR_POLY[2],
    openings: [
      { kind: 'window', t0: 1.02, t1: 2.72, y0: 0.82, y1: 2.2 },
      { kind: 'window', t0: 4.16, t1: 5.46, y0: 0.82, y1: 2.2 },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen / door wall',
    a: FLOOR_POLY[0],
    b: FLOOR_POLY[3],
    openings: [{ kind: 'door', t0: 0.08, t1: 0.88, y0: 0, y1: 2.0 }],
  },
]

const centroid: Vec2 = {
  x: FLOOR_POLY.reduce((s, p) => s + p.x, 0) / FLOOR_POLY.length,
  z: FLOOR_POLY.reduce((s, p) => s + p.z, 0) / FLOOR_POLY.length,
}

export type WallFrame = {
  wall: Wall
  length: number
  /** unit vector a → b */
  dir: Vec2
  /** unit normal pointing into the room */
  n: Vec2
}

export const WALL_FRAMES: WallFrame[] = WALLS.map((wall) => {
  const dx = wall.b.x - wall.a.x
  const dz = wall.b.z - wall.a.z
  const length = Math.hypot(dx, dz)
  const dir = { x: dx / length, z: dz / length }
  let n = { x: -dir.z, z: dir.x }
  if ((centroid.x - wall.a.x) * n.x + (centroid.z - wall.a.z) * n.z < 0) n = { x: -n.x, z: -n.z }
  return { wall, length, dir, n }
})

export const frameOf = (id: string) => WALL_FRAMES.find((f) => f.wall.id === id)!

/** Signed distance of a point from a wall (positive = inside the room). */
export const wallDistance = (f: WallFrame, p: Vec2) => (p.x - f.wall.a.x) * f.n.x + (p.z - f.wall.a.z) * f.n.z

/** Y-rotation that makes a furniture item's front (+z local) face along direction (dx, dz). */
export const facing = (dx: number, dz: number) => Math.atan2(dx, dz)

/**
 * Pose for an item standing against a wall: `t` metres along the wall from point a (item centre),
 * `depth` = item depth, `gap` = distance between the item's back and the wall.
 */
export function againstWall(wallId: string, t: number, depth: number, gap = 0.01) {
  const f = frameOf(wallId)
  const off = depth / 2 + gap
  return {
    x: f.wall.a.x + f.dir.x * t + f.n.x * off,
    z: f.wall.a.z + f.dir.z * t + f.n.z * off,
    rot: facing(f.n.x, f.n.z),
  }
}

/** Room width (z extent) at a given x. */
export const widthAt = (x: number) =>
  ROOM.widthKitchenEnd + ((ROOM.widthBedEnd - ROOM.widthKitchenEnd) * x) / ROOM.length

export const CEILING_LIGHTS: Vec2[] = [
  { x: 1.75, z: 1.3 },
  { x: 3.85, z: 1.1 },
]

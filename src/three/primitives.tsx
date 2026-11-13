import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { ReactNode } from 'react'

export type V3 = [number, number, number]
type Grain = 'x' | 'y' | 'z'

const cache = new Map<string, THREE.BufferGeometry>()

/**
 * Rewrites UVs so that they are expressed in metres (world scale). Textures then repeat at
 * their real-world size independent of the box dimensions, and wood grain follows `grain`.
 */
function worldUV(geo: THREE.BufferGeometry, grain: Grain, seed: number) {
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const uv = geo.attributes.uv
  const ru = Math.abs((Math.sin(seed * 12.9898) * 43758.5453) % 1)
  const rv = Math.abs((Math.sin(seed * 78.233) * 12543.123) % 1)
  geo.computeBoundingBox()
  const size = geo.boundingBox!.getSize(new THREE.Vector3()).toArray()
  // Wood decors are 0.6 m × 1.2 m tiles (mirror-repeated). Keep a part inside one tile whenever
  // it fits, so no mirror axis runs across a cabinet door.
  const offset = (axis: number, tile: number, rnd: number) => size[axis] / 2 + rnd * Math.max(0, tile - size[axis])
  const p = [0, 0, 0]
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i)
    const n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))]
    const axis = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2
    const inPlane = [0, 1, 2].filter((a) => a !== axis)
    const g = grain === 'x' ? 0 : grain === 'y' ? 1 : 2
    let ua = inPlane[0], va = inPlane[1]
    if (inPlane.includes(g)) { va = g; ua = inPlane.find((a) => a !== g)! }
    uv.setXY(i, p[ua] + offset(ua, 0.6, ru), p[va] + offset(va, 1.2, rv))
  }
  uv.needsUpdate = true
}

export function boxGeo(w: number, h: number, d: number, grain: Grain = 'y', round = 0): THREE.BufferGeometry {
  const key = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${grain}|${round}`
  let g = cache.get(key)
  if (!g) {
    const r = Math.min(round, Math.min(w, h, d) / 2 - 0.0005)
    g = r > 0.001 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)
    worldUV(g, grain, w * 3.1 + h * 7.7 + d * 13.3)
    cache.set(key, g)
  }
  return g
}

export function disposeGeometries() {
  cache.forEach((g) => g.dispose())
  cache.clear()
}

interface BProps {
  /** size: width (x), height (y), depth (z) */
  s: V3
  /** centre position */
  p?: V3
  r?: V3
  m: THREE.Material
  grain?: Grain
  round?: number
  cast?: boolean
  receive?: boolean
  children?: ReactNode
}

/** Box with world-scale UVs. The workhorse of all furniture models. */
export function B({ s, p, r, m, grain = 'y', round = 0, cast = true, receive = true, children }: BProps) {
  if (s[0] <= 0 || s[1] <= 0 || s[2] <= 0) return null
  return (
    <mesh geometry={boxGeo(s[0], s[1], s[2], grain, round)} material={m} position={p} rotation={r} castShadow={cast} receiveShadow={receive}>
      {children}
    </mesh>
  )
}

const cylCache = new Map<string, THREE.CylinderGeometry>()
function cylGeo(r1: number, r2: number, h: number, seg: number) {
  const key = `${r1.toFixed(4)}|${r2.toFixed(4)}|${h.toFixed(4)}|${seg}`
  let g = cylCache.get(key)
  if (!g) { g = new THREE.CylinderGeometry(r1, r2, h, seg); cylCache.set(key, g) }
  return g
}

interface CylProps {
  /** radius (or [top, bottom]) */
  rad: number | [number, number]
  h: number
  p?: V3
  r?: V3
  m: THREE.Material
  seg?: number
  cast?: boolean
}

/** Cylinder along local Y. */
export function Cyl({ rad, h, p, r, m, seg = 24, cast = true }: CylProps) {
  const [a, b] = Array.isArray(rad) ? rad : [rad, rad]
  return <mesh geometry={cylGeo(a, b, h, seg)} material={m} position={p} rotation={r} castShadow={cast} receiveShadow />
}

const UP = new THREE.Vector3(0, 1, 0)

/** Cylinder between two points (pipes, tubes, cables). */
export function Tube({ a, b, rad, m, seg = 20 }: { a: V3; b: V3; rad: number; m: THREE.Material; seg?: number }) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const len = va.distanceTo(vb)
  if (len < 1e-5) return null
  const q = new THREE.Quaternion().setFromUnitVectors(UP, vb.clone().sub(va).normalize())
  const mid = va.clone().add(vb).multiplyScalar(0.5)
  return <mesh geometry={cylGeo(rad, rad, len, seg)} material={m} position={mid} quaternion={q} castShadow receiveShadow />
}

const sphere = new THREE.SphereGeometry(1, 24, 16)
export function Ball({ rad, p, m, scale }: { rad: number; p?: V3; m: THREE.Material; scale?: V3 }) {
  const s = scale ?? [1, 1, 1]
  return <mesh geometry={sphere} material={m} position={p} scale={[rad * s[0], rad * s[1], rad * s[2]]} castShadow receiveShadow />
}

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CEILING_LIGHTS, FLOOR_POLY, ROOM, WALL_FRAMES, frameOf, wallDistance, type Opening, type WallFrame } from '../data/room'
import { mat } from '../lib/materials'
import { skyTexture } from '../lib/textures'
import { useStore } from '../state/store'
import { B, Cyl, Tube } from './primitives'

const H = ROOM.ceiling
const REVEAL = 0.3

/**
 * Walls are single-sided so the room opens up when the camera orbits outside ("doll's house").
 * Everything attached to a wall (windows, curtains, door) is hidden the same way.
 */
function useHideFromOutside(f: WallFrame) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = wallDistance(f, { x: camera.position.x, z: camera.position.z }) > -0.02
  })
  return ref
}

/** Horizontal polygon (floor / ceiling) with UVs in metres. */
function polyGeometry(up: boolean) {
  const g = new THREE.BufferGeometry()
  const pos: number[] = []
  const uv: number[] = []
  const nor: number[] = []
  for (const p of FLOOR_POLY) {
    pos.push(p.x, 0, p.z)
    uv.push(p.x, p.z)
    nor.push(0, up ? 1 : -1, 0)
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setIndex(up ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3])
  return g
}

/**
 * Local frame of a wall: x along the wall, y up, z = inward normal.
 * Returns the matrix and a converter from "t along a→b" to the local x coordinate.
 */
function wallBasis(f: WallFrame) {
  const sdir = new THREE.Vector3(f.n.z, 0, -f.n.x) // up × n
  const ab = new THREE.Vector3(f.wall.b.x - f.wall.a.x, 0, f.wall.b.z - f.wall.a.z)
  const fromA = ab.dot(sdir) > 0
  const o = fromA ? f.wall.a : f.wall.b
  const m = new THREE.Matrix4().makeBasis(sdir, new THREE.Vector3(0, 1, 0), new THREE.Vector3(f.n.x, 0, f.n.z))
  m.setPosition(o.x, 0, o.z)
  const toS = (t: number) => (fromA ? t : f.length - t)
  return { m, toS }
}

function WallMesh({ f }: { f: WallFrame }) {
  const { m, toS } = useMemo(() => wallBasis(f), [f])
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0); shape.lineTo(f.length, 0); shape.lineTo(f.length, H); shape.lineTo(0, H); shape.closePath()
    for (const o of f.wall.openings) {
      const s0 = Math.min(toS(o.t0), toS(o.t1))
      const s1 = Math.max(toS(o.t0), toS(o.t1))
      const hole = new THREE.Path()
      const y0 = Math.max(o.y0, 0.0001)
      hole.moveTo(s0, y0); hole.lineTo(s0, o.y1); hole.lineTo(s1, o.y1); hole.lineTo(s1, y0); hole.closePath()
      shape.holes.push(hole)
    }
    return new THREE.ShapeGeometry(shape)
  }, [f, toS])
  const material = f.wall.id === 'sofa' || f.wall.id === 'kitchen' ? mat('wallWhite') : mat('wallWarm')
  const attached = useHideFromOutside(f)
  return (
    <group matrix={m} matrixAutoUpdate={false}>
      <mesh geometry={geo} material={material} receiveShadow castShadow />
      <group ref={attached}>
      {f.wall.openings.map((o, i) => {
        const s0 = Math.min(toS(o.t0), toS(o.t1))
        const s1 = Math.max(toS(o.t0), toS(o.t1))
        return o.kind === 'window'
          ? <WindowUnit key={i} s0={s0} s1={s1} o={o} />
          : <DoorUnit key={i} s0={s0} s1={s1} o={o} hingeAtS0={toS(o.t0) === s0} />
      })}
      </group>
      {/* skirting board (skipped on the kitchen wall, hidden by the units) */}
      {f.wall.id !== 'kitchen' && (
        <B s={[f.length, 0.06, 0.014]} p={[f.length / 2, 0.03, 0.007]} m={mat('baseboard')} grain="x" cast={false} />
      )}
    </group>
  )
}

/** Window: plastered reveal, brown timber frame with a centre mullion, glass, and the outside backdrop. */
function WindowUnit({ s0, s1, o }: { s0: number; s1: number; o: Opening }) {
  const lighting = useStore((s) => s.lighting)
  const w = s1 - s0
  const h = o.y1 - o.y0
  const cx = (s0 + s1) / 2
  const cy = (o.y0 + o.y1) / 2
  const wall = mat('wallWarm')
  const frame = mat('windowFrame')
  const fz = -0.16
  const fw = 0.065
  const sky = useMemo(
    () => new THREE.MeshBasicMaterial({ map: lighting === 'day' ? skyTexture('#8fbdf0', '#eaf2f7') : skyTexture('#06080d', '#141a24'), toneMapped: lighting !== 'day' }),
    [lighting],
  )
  return (
    <group>
      {/* reveal: inward-facing planes, so the room stays open when seen from outside */}
      <mesh position={[s0, cy, -REVEAL / 2]} rotation={[0, Math.PI / 2, 0]} material={wall} receiveShadow><planeGeometry args={[REVEAL, h]} /></mesh>
      <mesh position={[s1, cy, -REVEAL / 2]} rotation={[0, -Math.PI / 2, 0]} material={wall} receiveShadow><planeGeometry args={[REVEAL, h]} /></mesh>
      <mesh position={[cx, o.y1, -REVEAL / 2]} rotation={[Math.PI / 2, 0, 0]} material={wall} receiveShadow><planeGeometry args={[w, REVEAL]} /></mesh>
      <mesh position={[cx, o.y0, -REVEAL / 2]} rotation={[-Math.PI / 2, 0, 0]} material={wall} receiveShadow><planeGeometry args={[w, REVEAL]} /></mesh>
      <B s={[w, 0.025, 0.2]} p={[cx, o.y0 + 0.0125, -0.06]} m={mat('plasticWhite')} />
      {/* frame */}
      <B s={[fw, h, 0.07]} p={[s0 + fw / 2, cy, fz]} m={frame} />
      <B s={[fw, h, 0.07]} p={[s1 - fw / 2, cy, fz]} m={frame} />
      <B s={[w, fw, 0.07]} p={[cx, o.y1 - fw / 2, fz]} m={frame} grain="x" />
      <B s={[w, fw, 0.07]} p={[cx, o.y0 + 0.025 + fw / 2, fz]} m={frame} grain="x" />
      <B s={[fw * 1.5, h, 0.075]} p={[cx, cy, fz]} m={frame} />
      {[-1, 1].map((sx) => (
        <B key={sx} s={[0.02, 0.11, 0.03]} p={[cx + sx * 0.0, cy - 0.05, fz + 0.05]} m={mat('steelBrushed')} />
      ))}
      {/* glass */}
      <mesh position={[cx, cy, fz]} material={mat('glass')}>
        <planeGeometry args={[w - fw * 2, h - fw * 2]} />
      </mesh>
      {/* outside */}
      <mesh position={[cx, cy, -REVEAL - 0.25]} material={sky}>
        <planeGeometry args={[w + 1.6, h + 1.6]} />
      </mesh>
    </group>
  )
}

/** Door: spruce casing, white leaf standing open against the sofa wall, and a glimpse of the hallway. */
function DoorUnit({ s0, s1, o, hingeAtS0 }: { s0: number; s1: number; o: Opening; hingeAtS0: boolean }) {
  const lighting = useStore((s) => s.lighting)
  const w = s1 - s0
  const cx = (s0 + s1) / 2
  const pine = mat('pine')
  const leafW = w - 0.01
  const hingeS = hingeAtS0 ? s0 : s1
  const dirSign = hingeAtS0 ? 1 : -1
  const open = (82 * Math.PI) / 180
  const hall = mat('hall')
  const hd = 1.25
  return (
    <group>
      {/* casing on the room side */}
      <B s={[0.07, o.y1 + 0.07, 0.022]} p={[s0 - 0.035, (o.y1 + 0.07) / 2, 0.011]} m={pine} />
      <B s={[0.07, o.y1 + 0.07, 0.022]} p={[s1 + 0.035, (o.y1 + 0.07) / 2, 0.011]} m={pine} />
      <B s={[w + 0.14, 0.07, 0.022]} p={[cx, o.y1 + 0.035, 0.011]} m={pine} grain="x" />
      {/* jamb lining through the wall */}
      <B s={[0.025, o.y1, 0.16]} p={[s0 + 0.0125, o.y1 / 2, -0.08]} m={pine} />
      <B s={[0.025, o.y1, 0.16]} p={[s1 - 0.0125, o.y1 / 2, -0.08]} m={pine} />
      <B s={[w, 0.025, 0.16]} p={[cx, o.y1 - 0.0125, -0.08]} m={pine} grain="x" />
      {/* leaf, hinged on the sofa-wall side, opened into the room */}
      <group position={[hingeS + dirSign * 0.03, 0, 0.03]} rotation={[0, dirSign * -open, 0]}>
        <B s={[leafW, o.y1 - 0.02, 0.04]} p={[dirSign * (leafW / 2), (o.y1 - 0.02) / 2 + 0.008, 0]} m={mat('white')} />
        {[-1, 1].map((side) => (
          <group key={side} position={[dirSign * (leafW - 0.07), 1.05, side * 0.03]}>
            <Cyl rad={0.024} h={0.012} r={[Math.PI / 2, 0, 0]} m={mat('black')} />
            <Tube a={[0, 0, 0]} b={[0, 0, side * 0.04]} rad={0.009} m={mat('black')} />
            <Tube a={[0, 0, side * 0.04]} b={[-dirSign * 0.12, 0, side * 0.04]} rad={0.009} m={mat('black')} />
            <Cyl rad={0.022} h={0.012} p={[0, -0.09, 0]} r={[Math.PI / 2, 0, 0]} m={mat('black')} />
          </group>
        ))}
      </group>
      {/* hallway stub behind the door */}
      {/* three walls + ceiling, single-sided and open towards the room */}
      <mesh position={[cx, (H - 0.4) / 2, -0.16 - hd]} material={hall}><planeGeometry args={[w + 0.7, H - 0.4]} /></mesh>
      <mesh position={[cx - (w + 0.7) / 2, (H - 0.4) / 2, -0.16 - hd / 2]} rotation={[0, Math.PI / 2, 0]} material={hall}><planeGeometry args={[hd, H - 0.4]} /></mesh>
      <mesh position={[cx + (w + 0.7) / 2, (H - 0.4) / 2, -0.16 - hd / 2]} rotation={[0, -Math.PI / 2, 0]} material={hall}><planeGeometry args={[hd, H - 0.4]} /></mesh>
      <mesh position={[cx, H - 0.4, -0.16 - hd / 2]} rotation={[Math.PI / 2, 0, 0]} material={hall}><planeGeometry args={[w + 0.7, hd]} /></mesh>
      <mesh position={[cx, 0.002, -hd / 2 - 0.08]} rotation={[-Math.PI / 2, 0, 0]} material={mat('floor')} receiveShadow>
        <planeGeometry args={[w + 0.7, hd + 0.16]} />
      </mesh>
      <B s={[0.6, 0.012, 0.4]} p={[cx, 0.008, -0.55]} m={mat('fabricBeige')} cast={false} />
      {lighting === 'evening' && <pointLight position={[cx, 1.9, -0.8]} intensity={1.6} color="#ffd9a0" distance={3.2} decay={2} />}
    </group>
  )
}

/** Curtain panel with folds, hanging along the window wall. Coordinates are in the wall frame. */
function Curtain({ s0, s1, y0, y1, sheer, folds, seed }: { s0: number; s1: number; y0: number; y1: number; sheer?: boolean; folds: number; seed: number }) {
  const geo = useMemo(() => {
    const w = s1 - s0
    const seg = Math.max(24, Math.round(folds * 10))
    const g = new THREE.PlaneGeometry(w, y1 - y0, seg, 6)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / w + 0.5
      const v = p.getY(i) / (y1 - y0) + 0.5 // 1 at the top
      // irregular soft folds: phase-modulated wave whose depth also varies across the panel
      const ph = u * folds * Math.PI * 2 + seed + 1.3 * Math.sin(u * folds * 1.7 + seed * 2.1)
      const depth = 0.6 + 0.4 * Math.sin(u * folds * 0.9 + seed * 5)
      const amp = (sheer ? 0.014 : 0.022) * depth * (0.7 + 0.3 * (1 - v))
      p.setZ(i, Math.sin(ph) * amp + Math.sin(ph * 2.3 + seed) * amp * 0.25)
    }
    g.computeVertexNormals()
    return g
  }, [s0, s1, y0, y1, sheer, folds, seed])
  return (
    <mesh geometry={geo} material={mat(sheer ? 'sheer' : 'curtainGrey')} position={[(s0 + s1) / 2, (y0 + y1) / 2, sheer ? 0.075 : 0.105]} castShadow={!sheer} receiveShadow />
  )
}

function Curtains() {
  const f = frameOf('window')
  const { m, toS } = useMemo(() => wallBasis(f), [f])
  const steel = mat('steel')
  const rodY = 2.4
  const T0 = 0.62, T1 = 6.0
  const S0 = Math.min(toS(T0), toS(T1))
  const S1 = Math.max(toS(T0), toS(T1))
  const span = (t0: number, t1: number) => ({ s0: Math.min(toS(t0), toS(t1)), s1: Math.max(toS(t0), toS(t1)) })
  const ref = useHideFromOutside(f)
  return (
    <group matrix={m} matrixAutoUpdate={false}>
      <group ref={ref}>
      <Tube a={[S0, rodY, 0.1]} b={[S1, rodY, 0.1]} rad={0.011} m={steel} />
      <Tube a={[S0, rodY, 0.07]} b={[S1, rodY, 0.07]} rad={0.006} m={steel} />
      {[S0, S1].map((s) => (
        <mesh key={s} position={[s, rodY, 0.1]} material={steel} castShadow>
          <sphereGeometry args={[0.022, 16, 12]} />
        </mesh>
      ))}
      {[S0 + 0.12, (S0 + S1) / 2, S1 - 0.12].map((s) => (
        <group key={s}>
          <Tube a={[s, rodY, 0]} b={[s, rodY, 0.1]} rad={0.007} m={steel} />
          <Cyl rad={0.022} h={0.006} p={[s, rodY, 0.003]} r={[Math.PI / 2, 0, 0]} m={steel} />
        </group>
      ))}
      {/* kitchen-side window */}
      <Curtain {...span(0.66, 1.14)} y0={0.42} y1={rodY - 0.02} folds={6} seed={1} />
      <Curtain {...span(1.08, 2.7)} y0={0.5} y1={rodY - 0.02} sheer folds={10} seed={2} />
      <Curtain {...span(2.62, 3.1)} y0={0.42} y1={rodY - 0.02} folds={6} seed={3} />
      {/* bed-side window */}
      <Curtain {...span(4.2, 4.66)} y0={0.42} y1={rodY - 0.02} folds={6} seed={4} />
      <Curtain {...span(4.6, 5.44)} y0={0.5} y1={rodY - 0.02} sheer folds={6} seed={5} />
      <Curtain {...span(5.34, 5.82)} y0={0.42} y1={rodY - 0.02} folds={6} seed={6} />
      </group>
    </group>
  )
}

/** Small fixed details: sockets, switch, fuse box, smoke detector. */
function Fixtures() {
  const white = mat('plasticWhite')
  return (
    <group>
      {/* fuse box next to the door, on the sofa wall */}
      <B s={[0.13, 0.19, 0.06]} p={[0.9, 1.32, 0.03]} m={white} round={0.006} />
      <B s={[0.09, 0.07, 0.01]} p={[0.9, 1.33, 0.062]} m={mat('anthracite')} />
      {/* sockets either side of the headboard */}
      <B s={[0.012, 0.08, 0.08]} p={[6.72, 0.62, 0.006]} r={[0, Math.PI / 2, 0]} m={white} round={0.004} />
      {/* smoke detector */}
      <Cyl rad={0.055} h={0.035} p={[5.9, H - 0.0175, 0.95]} m={white} />
    </group>
  )
}

function CeilingLights() {
  const lighting = useStore((s) => s.lighting)
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4e0', emissiveIntensity: 1 }), [])
  glow.emissiveIntensity = lighting === 'evening' ? 4 : 0.05
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => { if (ref.current) ref.current.visible = camera.position.y < H })
  return (
    <group ref={ref}>
      {CEILING_LIGHTS.map((l, i) => (
        <group key={i} position={[l.x, H, l.z]}>
          <Cyl rad={0.2} h={0.02} p={[0, -0.01, 0]} m={mat('plasticWhite')} seg={40} cast={false} />
          <mesh position={[0, -0.02, 0]} scale={[0.19, 0.055, 0.19]} material={glow}>
            <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Permanent architecture – never part of the editable furniture data. */
export function RoomShell({ onFloorDown }: { onFloorDown?: (e: any) => void }) {
  const floor = useMemo(() => polyGeometry(true), [])
  const ceiling = useMemo(() => polyGeometry(false), [])
  return (
    <group>
      <mesh geometry={floor} material={mat('floor')} receiveShadow onPointerDown={onFloorDown} name="floor" />
      <mesh geometry={ceiling} material={mat('ceiling')} position={[0, H, 0]} receiveShadow castShadow />
      {WALL_FRAMES.map((f) => <WallMesh key={f.wall.id} f={f} />)}
      <Curtains />
      <Fixtures />
      <CeilingLights />
    </group>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'
import { mat } from '../../lib/materials'
import { labelTexture } from '../../lib/textures'
import { B, Ball, Cyl, Tube, type V3 } from '../primitives'
import type { ModelProps } from './types'

function Label({ text, w, h, p, color = '#2a2a2a', font }: { text: string; w: number; h: number; p: V3; color?: string; font?: string }) {
  const m = useMemo(
    () => new THREE.MeshBasicMaterial({ map: labelTexture(text, color, font), transparent: true, toneMapped: true, depthWrite: false }),
    [text, color, font],
  )
  return (
    <mesh position={p} material={m}>
      <planeGeometry args={[w, h]} />
    </mesh>
  )
}

export function Fridge({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const door = 0.055
  return (
    <group>
      <B s={[W, H - 0.03, D - door - 0.006]} p={[0, 0.03 + (H - 0.03) / 2, -door / 2 - 0.003]} m={primary} round={0.012} />
      <B s={[W, H - 0.05, door]} p={[0, 0.045 + (H - 0.05) / 2, D / 2 - door / 2]} m={primary} round={0.016} />
      <B s={[W - 0.04, 0.03, D - 0.1]} p={[0, 0.015, -0.02]} m={mat('anthracite')} />
      <B s={[W - 0.01, 0.012, D - 0.08]} p={[0, H - 0.004, -0.03]} m={mat('plasticWhite')} round={0.004} />
      <Label text="gorenje" w={0.11} h={0.028} p={[0, H - 0.13, D / 2 + 0.001]} color="#3a3a3a" font="700 46px Arial, sans-serif" />
    </group>
  )
}

export function Microwave({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const fz = D / 2
  const panelW = W * 0.24
  const winW = W - panelW - 0.03
  return (
    <group>
      <B s={[W, H - 0.012, D]} p={[0, 0.012 + (H - 0.012) / 2, 0]} m={primary} round={0.008} />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <Cyl key={`${sx}${sz}`} rad={0.012} h={0.012} p={[sx * (W / 2 - 0.04), 0.006, sz * (D / 2 - 0.04)]} m={mat('rubberBlack')} />
      )))}
      <B s={[winW, H - 0.07, 0.006]} p={[-W / 2 + 0.015 + winW / 2, 0.012 + (H - 0.012) / 2, fz + 0.002]} m={mat('blackGloss')} />
      <B s={[winW - 0.02, 0.003, 0.007]} p={[-W / 2 + 0.015 + winW / 2, 0.055, fz + 0.002]} m={mat('red')} />
      <Label text="LogoStar" w={panelW - 0.02} h={0.022} p={[W / 2 - panelW / 2 - 0.004, H - 0.04, fz + 0.001]} color="#1d2a55" font="700 40px Arial, sans-serif" />
      {[H * 0.62, H * 0.36].map((y) => (
        <group key={y}>
          <Cyl rad={0.024} h={0.018} p={[W / 2 - panelW / 2 - 0.004, y, fz + 0.009]} r={[Math.PI / 2, 0, 0]} m={primary} />
          <B s={[0.008, 0.04, 0.012]} p={[W / 2 - panelW / 2 - 0.004, y, fz + 0.02]} m={mat('plasticWhite')} />
        </group>
      ))}
      <B s={[panelW - 0.04, 0.022, 0.004]} p={[W / 2 - panelW / 2 - 0.004, 0.045, fz + 0.002]} m={mat('plasticWhite')} />
    </group>
  )
}

/** Black steel wood stove with stone side tiles and the flue running diagonally to the wall. */
export function Stove({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const tile = mat('stoneTile')
  const fz = D / 2
  const pipe = mat('blackSteel')
  const R = 0.065
  // flue path (local coordinates). The wall thimble sits up-left of the stove, as in the photos.
  const wallZ = -(D / 2 + 0.28)
  const p0: V3 = [0, H, -0.03]
  const p1: V3 = [0, H + 0.3, -0.03]
  const p2: V3 = [-0.7, 1.93, wallZ + 0.16]
  const p3: V3 = [-0.74, 1.95, wallZ]
  return (
    <group>
      {/* top plate */}
      <B s={[W + 0.03, 0.03, D + 0.03]} p={[0, H - 0.015, 0]} m={primary} round={0.006} />
      {/* corner posts */}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <B key={`${sx}${sz}`} s={[0.03, H - 0.03, 0.03]} p={[sx * (W / 2 - 0.015), (H - 0.03) / 2, sz * (D / 2 - 0.015)]} m={primary} />
      )))}
      {/* body above the log niche */}
      <B s={[W - 0.03, H - 0.27, D - 0.03]} p={[0, 0.24 + (H - 0.27) / 2, 0]} m={primary} />
      <B s={[W - 0.03, 0.02, D - 0.03]} p={[0, 0.03, 0]} m={primary} />
      <B s={[W - 0.03, 0.22, 0.012]} p={[0, 0.13, -D / 2 + 0.02]} m={primary} />
      {/* stone tiles on both sides, split by a steel strip */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B s={[0.012, H - 0.09, D / 2 - 0.045]} p={[sx * (W / 2 - 0.004), 0.04 + (H - 0.09) / 2, -D / 4 + 0.012]} m={tile} />
          <B s={[0.012, H - 0.09, D / 2 - 0.045]} p={[sx * (W / 2 - 0.004), 0.04 + (H - 0.09) / 2, D / 4 - 0.012]} m={tile} />
        </group>
      ))}
      {/* firebox door */}
      <B s={[W - 0.1, 0.32, 0.03]} p={[-0.01, H - 0.22, fz - 0.005]} m={primary} round={0.004} />
      <B s={[W - 0.2, 0.2, 0.004]} p={[-0.01, H - 0.21, fz + 0.011]} m={mat('stoveGlass')} cast={false} />
      <Cyl rad={0.011} h={0.1} p={[W / 2 - 0.035, H - 0.2, fz + 0.03]} m={mat('steel')} />
      <B s={[0.03, 0.012, 0.03]} p={[W / 2 - 0.045, H - 0.2, fz + 0.015]} m={mat('steelBrushed')} />
      {/* stone band + ash drawer */}
      <B s={[W - 0.07, 0.09, 0.012]} p={[0, H - 0.44, fz - 0.012]} m={tile} />
      <B s={[W - 0.08, 0.13, 0.02]} p={[0, H - 0.57, fz - 0.008]} m={primary} round={0.003} />
      <B s={[0.1, 0.012, 0.014]} p={[0, H - 0.61, fz + 0.008]} m={mat('steelBrushed')} />
      <Cyl rad={0.009} h={0.02} p={[0, H - 0.55, fz + 0.006]} r={[Math.PI / 2, 0, 0]} m={mat('black')} />
      {/* flue */}
      <Tube a={p0} b={p1} rad={R} m={pipe} />
      <Tube a={[0, H + 0.2, -0.03]} b={[0, H + 0.26, -0.03]} rad={R + 0.006} m={pipe} />
      <Ball rad={R} p={p1} m={pipe} />
      <Tube a={p1} b={p2} rad={R} m={pipe} />
      <Ball rad={R} p={p2} m={pipe} />
      <Tube a={p2} b={p3} rad={R} m={pipe} />
      <Tube a={[p3[0], p3[1], wallZ + 0.03]} b={p3} rad={0.125} m={pipe} />
    </group>
  )
}

export function FloorPlate({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  return (
    <group>
      <B s={[W, H, D]} p={[0, H / 2, 0]} m={primary} cast={false} />
      {/* ash shovel lying on the plate */}
      <group position={[W / 2 - 0.12, H, D / 2 - 0.2]} rotation={[0, 0.9, 0]}>
        <B s={[0.11, 0.012, 0.16]} p={[0, 0.008, 0]} m={mat('blackSteel')} />
        <B s={[0.11, 0.03, 0.006]} p={[0, 0.02, -0.08]} m={mat('blackSteel')} />
        <Tube a={[0, 0.02, 0.08]} b={[0, 0.045, 0.36]} rad={0.012} m={mat('walnut')} />
      </group>
    </group>
  )
}

/** TV on a swivel arm: back plate on the wall (−z), screen turned towards local +x. */
export function TV({ item }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const steel = mat('blackSteel')
  const silver = mat('steelBrushed')
  const yaw = 0.35
  const pivotZ = -D / 2 + 0.16
  return (
    <group>
      <B s={[0.12, 0.22, 0.02]} p={[0, H / 2, -D / 2 + 0.01]} m={steel} />
      <Tube a={[0, H / 2, -D / 2 + 0.02]} b={[0, H / 2, pivotZ]} rad={0.016} m={steel} />
      <group position={[0, 0, pivotZ]} rotation={[0, yaw, 0]}>
        <B s={[0.3, 0.3, 0.025]} p={[0, H / 2, 0.012]} m={steel} />
        <B s={[W, H, 0.028]} p={[0, H / 2, 0.04]} m={mat('black')} round={0.004} />
        <B s={[W - 0.012, H - 0.03, 0.002]} p={[0, H / 2 + 0.008, 0.0555]} m={mat('screen')} cast={false} />
        <B s={[W + 0.004, 0.016, 0.032]} p={[0, 0.008, 0.04]} m={silver} />
        <B s={[W + 0.004, 0.004, 0.032]} p={[0, H - 0.002, 0.04]} m={silver} />
        <B s={[0.004, H, 0.032]} p={[-W / 2, H / 2, 0.04]} m={silver} />
        <B s={[0.004, H, 0.032]} p={[W / 2, H / 2, 0.04]} m={silver} />
        <Tube a={[0.02, 0.1, 0.02]} b={[0.03, -0.2, 0.0]} rad={0.004} m={mat('rubberBlack')} />
      </group>
    </group>
  )
}

export function Fan({ item, primary }: ModelProps) {
  const { w: W, h: H } = item
  const headY = H - 0.21
  const cage = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.5, wireframe: true }), [])
  const R = 0.2
  return (
    <group>
      <B s={[W, 0.03, 0.05]} p={[0, 0.015, 0]} r={[0, Math.PI / 4, 0]} m={primary} round={0.008} />
      <B s={[W, 0.03, 0.05]} p={[0, 0.015, 0]} r={[0, -Math.PI / 4, 0]} m={primary} round={0.008} />
      <Cyl rad={0.035} h={0.06} p={[0, 0.05, 0]} m={primary} />
      <Cyl rad={0.022} h={0.6} p={[0, 0.33, 0]} m={primary} />
      <Cyl rad={0.028} h={0.05} p={[0, 0.63, 0]} m={mat('plasticGrey')} />
      <Cyl rad={0.014} h={headY - 0.68} p={[0, 0.64 + (headY - 0.68) / 2, 0]} m={mat('steel')} />
      <B s={[0.07, 0.12, 0.07]} p={[0, headY - 0.07, -0.05]} m={primary} round={0.015} />
      {/* motor + cage + blades, facing +z */}
      <Cyl rad={[0.06, 0.07]} h={0.13} p={[0, headY, -0.08]} r={[Math.PI / 2, 0, 0]} m={primary} />
      <mesh position={[0, headY, 0.03]} scale={[R, R, 0.055]} material={cage} castShadow>
        <sphereGeometry args={[1, 28, 10]} />
      </mesh>
      {[0.012, 0.075].map((z) => (
        <mesh key={z} position={[0, headY, z - 0.012]} material={primary} castShadow>
          <torusGeometry args={[R, 0.006, 8, 48]} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 3 + 0.4) * 0.09, headY + Math.sin((i * 2 * Math.PI) / 3 + 0.4) * 0.09, 0.03]}
          rotation={[0.25, 0, (i * 2 * Math.PI) / 3 + 0.4]} scale={[1, 0.62, 1]} material={mat('plasticWhite')}>
          <circleGeometry args={[0.085, 20]} />
        </mesh>
      ))}
      <Cyl rad={0.045} h={0.012} p={[0, headY, 0.086]} r={[Math.PI / 2, 0, 0]} m={mat('plasticWhite')} />
      <Cyl rad={0.028} h={0.004} p={[0, headY, 0.094]} r={[Math.PI / 2, 0, 0]} m={mat('anthracite')} />
    </group>
  )
}

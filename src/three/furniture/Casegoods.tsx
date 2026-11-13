import { MeshReflectorMaterial } from '@react-three/drei'
import { mat } from '../../lib/materials'
import { B, Cyl, Tube } from '../primitives'
import type { ModelProps } from './types'

/** Two-door wardrobe with full-height mirror doors (real-time planar reflection). */
export function Wardrobe({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const t = 0.022
  const fz = D / 2
  const doorH = H - 0.09
  const doorY = 0.055 + doorH / 2
  const mw = W - 2 * t - 0.012
  return (
    <group>
      <B s={[t, H - 0.02, D - 0.02]} p={[-W / 2 + t / 2, (H - 0.02) / 2, -0.01]} m={primary} />
      <B s={[t, H - 0.02, D - 0.02]} p={[W / 2 - t / 2, (H - 0.02) / 2, -0.01]} m={primary} />
      <B s={[W + 0.015, 0.022, D + 0.008]} p={[0, H - 0.011, 0]} m={primary} grain="x" />
      <B s={[W - 2 * t, 0.05, D - 0.05]} p={[0, 0.025, -0.02]} m={primary} grain="x" />
      <B s={[W - 2 * t, H - 0.03, 0.01]} p={[0, (H - 0.03) / 2, -D / 2 + 0.006]} m={primary} />
      {/* door leaves (wood edge visible around the mirrors) */}
      <B s={[W - 2 * t, doorH + 0.02, 0.018]} p={[0, doorY, fz - 0.011]} m={primary} />
      {/* mirror */}
      <mesh position={[0, doorY, fz - 0.0015]}>
        <planeGeometry args={[mw, doorH]} />
        <MeshReflectorMaterial resolution={1024} mirror={1} blur={[0, 0]} mixBlur={0} mixStrength={1.15} color="#eef0f1" metalness={0} roughness={1} />
      </mesh>
      {/* centre stiles between the two doors */}
      <B s={[0.012, doorH + 0.02, 0.006]} p={[-0.008, doorY, fz + 0.002]} m={primary} />
      <B s={[0.012, doorH + 0.02, 0.006]} p={[0.008, doorY, fz + 0.002]} m={primary} />
      <B s={[0.003, doorH + 0.02, 0.007]} p={[0, doorY, fz + 0.002]} m={mat('black')} cast={false} />
    </group>
  )
}

export function HeatShield({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  return <B s={[W, H, D]} p={[0, H / 2, 0]} m={primary} />
}

/** Row of three lift-up wall units. */
export function WallCabinets({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const n = Math.max(1, Math.round(W / 0.53))
  const uw = W / n
  return (
    <group>
      <B s={[W, H, D - 0.02]} p={[0, H / 2, -0.01]} m={primary} grain="x" />
      {Array.from({ length: n }, (_, i) => {
        const x = -W / 2 + uw * (i + 0.5)
        return (
          <group key={i}>
            <B s={[uw - 0.004, H - 0.004, 0.018]} p={[x, H / 2, D / 2 - 0.009]} m={primary} grain="x" />
            <B s={[0.13, 0.014, 0.022]} p={[x, 0.065, D / 2 + 0.012]} m={mat('steelBrushed')} round={0.004} />
          </group>
        )
      })}
    </group>
  )
}

/** Four-drawer chest: anthracite carcass, handle-less wood fronts. */
export function Dresser({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const body = mat('anthracite')
  const fz = D / 2
  const y0 = 0.075
  const span = H - 0.022 - y0
  const gap = 0.02
  const n = 4
  const fh = (span - gap * (n - 1)) / n
  return (
    <group>
      <B s={[W, H - 0.02, D - 0.02]} p={[0, 0.02 + (H - 0.04) / 2 + 0.01, -0.01]} m={body} />
      <B s={[W + 0.004, 0.02, D + 0.004]} p={[0, H - 0.01, 0]} m={body} />
      <B s={[W - 0.06, 0.03, D - 0.08]} p={[0, 0.015, -0.01]} m={body} />
      {Array.from({ length: n }, (_, i) => (
        <B key={i} s={[W - 0.035, fh, 0.018]} p={[0, y0 + fh / 2 + i * (fh + gap), fz - 0.009]} r={[0.0, 0, 0]} m={primary} grain="x" />
      ))}
      {/* things on top: lotion bottle, remote, plug */}
      <Cyl rad={0.03} h={0.15} p={[W * 0.2, H + 0.075, 0.02]} m={mat('plasticWhite')} />
      <Cyl rad={0.031} h={0.07} p={[W * 0.2, H + 0.07, 0.02]} m={mat('fabricGreen')} />
      <Cyl rad={0.009} h={0.05} p={[W * 0.2, H + 0.17, 0.02]} m={mat('plasticWhite')} />
      <B s={[0.15, 0.015, 0.04]} p={[-W * 0.22, H + 0.008, 0.06]} r={[0, 0.3, 0]} m={mat('black')} round={0.005} />
    </group>
  )
}

/** Low table: black steel frame, wood top, apron, lower drawer box. */
export function CoffeeTable({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const leg = 0.025
  const steel = mat('blackSteel')
  const topT = 0.03
  return (
    <group>
      <B s={[W, topT, D]} p={[0, H - topT / 2, 0]} m={primary} grain="x" />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <B key={`${sx}${sz}`} s={[leg, H - topT, leg]} p={[sx * (W / 2 - leg / 2), (H - topT) / 2, sz * (D / 2 - leg / 2)]} m={steel} />
      )))}
      {/* steel rails top and bottom on the short sides */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B s={[leg, leg, D - leg * 2]} p={[sx * (W / 2 - leg / 2), 0.07, 0]} m={steel} />
        </group>
      ))}
      {/* wood apron under the top */}
      <B s={[W - leg * 2, 0.085, D - leg * 2]} p={[0, H - topT - 0.0425, 0]} m={primary} grain="x" />
      {/* lower drawer box */}
      <B s={[W - leg * 2, 0.15, D - leg * 2]} p={[0, 0.06 + 0.075, 0]} m={primary} grain="x" />
      <B s={[W - leg * 2 - 0.012, 0.118, 0.006]} p={[0, 0.06 + 0.07, D / 2 - leg + 0.002]} m={primary} grain="x" />
      <B s={[0.12, 0.012, 0.016]} p={[W * 0.2, 0.06 + 0.1, D / 2 - leg + 0.012]} m={mat('black')} />
    </group>
  )
}

export function Desk({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const steel = mat('blackSteel')
  return (
    <group>
      <B s={[W, 0.028, D]} p={[0, H - 0.014, 0]} m={primary} grain="x" />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B s={[0.04, H - 0.028, 0.04]} p={[sx * (W / 2 - 0.05), (H - 0.028) / 2, D / 2 - 0.05]} m={steel} />
          <B s={[0.04, H - 0.028, 0.04]} p={[sx * (W / 2 - 0.05), (H - 0.028) / 2, -D / 2 + 0.05]} m={steel} />
          <B s={[0.04, 0.04, D - 0.14]} p={[sx * (W / 2 - 0.05), H - 0.048, 0]} m={steel} />
        </group>
      ))}
      <B s={[W - 0.14, 0.04, 0.03]} p={[0, H - 0.048, -D / 2 + 0.05]} m={steel} />
    </group>
  )
}

export function Chair({ item, primary }: ModelProps) {
  const { w: W, h: H } = item
  const steel = mat('blackSteel')
  const seatY = 0.47
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * Math.PI * 2) / 5
        const x = Math.sin(a) * (W / 2 - 0.03)
        const z = Math.cos(a) * (W / 2 - 0.03)
        return (
          <group key={i}>
            <Tube a={[0, 0.09, 0]} b={[x, 0.06, z]} rad={0.014} m={steel} />
            <Cyl rad={0.025} h={0.04} p={[x, 0.025, z]} r={[0, 0, Math.PI / 2]} m={mat('rubberBlack')} />
          </group>
        )
      })}
      <Cyl rad={0.025} h={seatY - 0.12} p={[0, 0.09 + (seatY - 0.12) / 2, 0]} m={mat('steel')} />
      <B s={[0.48, 0.08, 0.46]} p={[0, seatY, 0.02]} m={primary} round={0.035} />
      <B s={[0.05, 0.3, 0.03]} p={[0, seatY + 0.14, -0.22]} r={[-0.1, 0, 0]} m={steel} />
      <B s={[0.44, H - seatY - 0.12, 0.07]} p={[0, seatY + 0.12 + (H - seatY - 0.12) / 2, -0.24]} r={[-0.1, 0, 0]} m={primary} round={0.03} />
    </group>
  )
}

export function Bookshelf({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const t = 0.02
  const n = Math.max(2, Math.round(H / 0.36))
  const gapH = (H - t) / n
  const colors = ['fabricBlue', 'fabricBeige', 'fabricGreen', 'fabricTerracotta', 'anthracite', 'white', 'cream']
  return (
    <group>
      <B s={[t, H, D]} p={[-W / 2 + t / 2, H / 2, 0]} m={primary} />
      <B s={[t, H, D]} p={[W / 2 - t / 2, H / 2, 0]} m={primary} />
      <B s={[W - 2 * t, H, 0.006]} p={[0, H / 2, -D / 2 + 0.003]} m={primary} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <B key={i} s={[W - 2 * t, t, D - 0.006]} p={[0, t / 2 + i * gapH, 0.003]} m={primary} grain="x" />
      ))}
      {Array.from({ length: n }, (_, row) => {
        const books = []
        let x = -W / 2 + t + 0.01
        let i = 0
        const limit = W / 2 - t - (row % 2 ? 0.25 : 0.05)
        while (x < limit) {
          const bw = 0.022 + ((row * 7 + i * 13) % 5) * 0.006
          const bh = gapH * (0.6 + ((row * 3 + i * 5) % 4) * 0.07)
          books.push(
            <B key={i} s={[bw - 0.002, bh, D * 0.7]} p={[x + bw / 2, t + row * gapH + bh / 2, 0.01]} m={mat(colors[(row * 5 + i * 3) % colors.length])} />,
          )
          x += bw
          i++
        }
        return <group key={row}>{books}</group>
      })}
    </group>
  )
}

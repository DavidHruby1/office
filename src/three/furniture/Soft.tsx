import { mat } from '../../lib/materials'
import { B, Ball, Cyl, Tube } from '../primitives'
import type { ModelProps } from './types'

/** Armless click-clack sofa bed under a waffle throw, with two pillows. Back against −z. */
export function Sofa({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const seatTop = Math.min(0.4, H * 0.52)
  const seatH = 0.15
  const backT = 0.14
  const lean = 0.2
  const backLen = (H - seatTop + 0.1) / Math.cos(lean)
  const pillow = mat('pillow')
  const black = mat('black')
  return (
    <group>
      {/* black frame + legs */}
      <B s={[W - 0.06, 0.05, D - 0.14]} p={[0, seatTop - seatH - 0.025, 0.02]} m={black} />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <B key={`${sx}${sz}`} s={[0.05, seatTop - seatH - 0.02, 0.05]} p={[sx * (W / 2 - 0.12), (seatTop - seatH - 0.02) / 2, 0.02 + sz * (D / 2 - 0.18)]} m={black} />
      )))}
      {/* seat mattress */}
      <B s={[W, seatH, D - backT * 0.6]} p={[0, seatTop - seatH / 2, backT * 0.3]} m={primary} round={0.06} />
      {/* back mattress, leaning */}
      <group position={[0, seatTop - 0.08, -D / 2 + backT / 2 + 0.03]} rotation={[-lean, 0, 0]}>
        <B s={[W, backLen, backT]} p={[0, backLen / 2, 0]} m={primary} round={0.06} />
      </group>
      {/* throw hanging over the front and the right end */}
      <B s={[W * 0.62, seatTop - 0.2, 0.012]} p={[-W * 0.12, (seatTop - 0.2) / 2 + 0.17, D / 2 + 0.003]} r={[0.04, 0, 0]} m={primary} />
      <B s={[0.012, seatTop - 0.22, D * 0.6]} p={[W / 2 + 0.003, (seatTop - 0.22) / 2 + 0.19, 0.06]} m={primary} />
      {/* pillows */}
      <group position={[-W * 0.27, seatTop + 0.15, -0.03]} rotation={[-0.7, 0.3, 0.1]}>
        <B s={[0.56, 0.38, 0.13]} m={pillow} round={0.06} />
      </group>
      <group position={[W * 0.16, seatTop + 0.16, -0.12]} rotation={[-0.55, -0.12, -0.06]}>
        <B s={[0.56, 0.38, 0.13]} m={pillow} round={0.06} />
      </group>
    </group>
  )
}

/** Double bed. Head at −z, foot at +z. */
export function Bed({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const post = 0.08
  const railTop = Math.min(0.45, H * 0.5)
  const railH = 0.17
  const hz = -D / 2 + post / 2 // head post centre
  const fzp = D / 2 - post / 2
  const hbTop = H - 0.02
  const hw = W / 2
  return (
    <group>
      {/* posts */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B s={[post, railTop, post]} p={[sx * (hw - post / 2), railTop / 2, fzp]} m={primary} />
          <B s={[post, hbTop, post]} p={[sx * (hw - post / 2), hbTop / 2, hz + 0.16]} m={primary} />
          {/* side rails */}
          <B s={[0.03, railH, D - 0.2]} p={[sx * (hw - 0.03), railTop - railH / 2, 0.08]} m={primary} grain="z" />
        </group>
      ))}
      <B s={[W - post * 2, railH, 0.03]} p={[0, railTop - railH / 2, fzp]} m={primary} grain="x" />
      {/* slotted headboard */}
      <B s={[W - post * 2, 0.2, 0.03]} p={[0, railTop - 0.02, hz + 0.16]} m={primary} grain="x" />
      <B s={[W - post * 2, 0.17, 0.03]} p={[0, hbTop - 0.085, hz + 0.16]} m={primary} grain="x" />
      {/* storage box behind the headboard + shelf board on top */}
      <B s={[W, hbTop - 0.25, 0.02]} p={[0, 0.25 + (hbTop - 0.25) / 2, -D / 2 + 0.012]} m={primary} grain="x" />
      <B s={[W, 0.02, 0.22]} p={[0, H - 0.01, -D / 2 + 0.11]} m={mat('sonoma')} grain="x" />
      {/* slat base */}
      <B s={[W - 0.08, 0.02, D - 0.3]} p={[0, railTop - 0.14, 0.1]} m={primary} grain="x" />
      {/* mattress with orange sheet */}
      <B s={[W - 0.07, 0.2, D - 0.3]} p={[0, railTop - 0.03, 0.1]} m={mat('sheetOrange')} round={0.05} />
      {/* pillows */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * W * 0.24, railTop + 0.12, hz + 0.42]} rotation={[0.2, sx * 0.08, 0]}>
          <Ball rad={1} scale={[0.3, 0.07, 0.2]} m={mat('pillow')} />
        </group>
      ))}
      {/* two duvets with blue blankets */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * W * 0.235, railTop + 0.07, 0.24]} rotation={[0, sx * 0.025, 0]}>
          <B s={[W / 2 - 0.07, 0.06, D - 0.6]} p={[0, 0.03, 0.02]} m={mat('duvetWhite')} round={0.029} />
          <B s={[W / 2 - 0.045, 0.075, D - 0.68]} p={[0, 0.05, -0.02]} r={[0, 0, sx * 0.012]} m={mat('blanketBlue')} round={0.036} />
          {/* soft folds */}
          <Ball rad={1} p={[sx * 0.08, 0.075, -0.25]} scale={[0.3, 0.035, 0.42]} m={mat('blanketBlue')} />
          <Ball rad={1} p={[-sx * 0.1, 0.075, 0.38]} scale={[0.26, 0.03, 0.33]} m={mat('blanketBlue')} />
        </group>
      ))}
      {/* bedside lamp on the shelf */}
      <B s={[0.085, 0.17, 0.085]} p={[-W * 0.2, H + 0.085, -D / 2 + 0.11]} m={mat('glassFrosted')} round={0.006} />
    </group>
  )
}

export function Basket({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const t = 0.012
  const inner = mat('fabricGrey')
  return (
    <group>
      <B s={[W, t, D]} p={[0, t / 2, 0]} m={inner} />
      <B s={[W, H, t]} p={[0, H / 2, D / 2 - t / 2]} m={primary} round={0.004} />
      <B s={[W, H, t]} p={[0, H / 2, -D / 2 + t / 2]} m={primary} round={0.004} />
      <B s={[t, H, D]} p={[W / 2 - t / 2, H / 2, 0]} m={primary} round={0.004} />
      <B s={[t, H, D]} p={[-W / 2 + t / 2, H / 2, 0]} m={primary} round={0.004} />
      <B s={[W - 0.03, 0.01, D - 0.03]} p={[0, H * 0.55, 0]} m={inner} />
    </group>
  )
}

/** Two folded round stools leaning against the wall (back at −z). */
export function Stools({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const steel = mat('plasticGrey')
  const r = Math.min(0.16, W / 2 - 0.01)
  const one = (dx: number, dz: number, key: number) => (
    <group key={key} position={[dx, 0, dz]} rotation={[-0.16, 0, 0]}>
      <Cyl rad={r} h={0.028} p={[0, H - r - 0.02, 0]} r={[Math.PI / 2, 0, 0]} m={primary} seg={36} />
      <B s={[0.1, 0.13, 0.002]} p={[0.01, H - r - 0.02, 0.016]} m={mat('plasticWhite')} cast={false} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Tube a={[s * r * 0.75, H - r - 0.05, -0.02]} b={[s * r * 0.85, 0.01, -0.03]} rad={0.009} m={steel} />
          <Tube a={[s * r * 0.45, H - r - 0.05, -0.035]} b={[s * r * 0.5, 0.01, 0.01]} rad={0.009} m={steel} />
        </group>
      ))}
      <Tube a={[-r * 0.85, 0.012, -0.03]} b={[r * 0.85, 0.012, -0.03]} rad={0.009} m={steel} />
    </group>
  )
  return <group>{[one(-0.012, -D / 2 + 0.07, 0), one(0.012, -D / 2 + 0.125, 1)]}</group>
}

export function Painting({ item }: ModelProps) {
  const { w: W, d: D, h: H } = item
  return (
    <group>
      <B s={[W, H, D]} p={[0, H / 2, 0]} m={mat('canvasEdge')} />
      <mesh position={[0, H / 2, D / 2 + 0.0006]} material={mat('canvas')}>
        <planeGeometry args={[W, H]} />
      </mesh>
    </group>
  )
}

export function Rug({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  return <B s={[W, H, D]} p={[0, H / 2, 0]} m={primary} round={0.004} cast={false} />
}

export function Armchair({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const arm = 0.14
  const seatTop = 0.42
  return (
    <group>
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <Cyl key={`${sx}${sz}`} rad={[0.022, 0.015]} h={0.14} p={[sx * (W / 2 - 0.08), 0.07, sz * (D / 2 - 0.08)]} m={mat('walnut')} />
      )))}
      <B s={[W, 0.16, D]} p={[0, 0.22, 0]} m={primary} round={0.04} />
      <B s={[W - arm * 2, 0.16, D - 0.2]} p={[0, seatTop - 0.06, 0.08]} m={primary} round={0.06} />
      <B s={[W, H - 0.2, 0.2]} p={[0, 0.2 + (H - 0.2) / 2, -D / 2 + 0.1]} r={[-0.08, 0, 0]} m={primary} round={0.07} />
      {[-1, 1].map((sx) => (
        <B key={sx} s={[arm, 0.42, D - 0.06]} p={[sx * (W / 2 - arm / 2), 0.4, 0.02]} m={primary} round={0.06} />
      ))}
    </group>
  )
}

export function Plant({ item, primary }: ModelProps) {
  const { w: W, h: H } = item
  const potH = Math.min(0.34, H * 0.32)
  const r = W * 0.36
  const leaf = mat('leaf')
  const leaves = Array.from({ length: 14 }, (_, i) => {
    const a = i * 2.39996
    const t = 0.35 + (i % 5) * 0.14
    return { a, y: potH + (H - potH) * t, rad: W * (0.28 + 0.12 * ((i * 7) % 3)), tilt: 0.5 + (i % 4) * 0.2 }
  })
  return (
    <group>
      <Cyl rad={[r, r * 0.72]} h={potH} p={[0, potH / 2, 0]} m={primary} seg={32} />
      <Cyl rad={r * 0.94} h={0.01} p={[0, potH - 0.012, 0]} m={mat('soil')} />
      <Tube a={[0, potH - 0.02, 0]} b={[0.02, H * 0.86, 0.01]} rad={0.012} m={mat('walnut')} />
      {leaves.map((l, i) => (
        <group key={i} position={[0.01, l.y, 0.005]} rotation={[0, l.a, 0]}>
          <group rotation={[0, 0, -l.tilt]}>
            <Ball rad={1} p={[l.rad * 0.55, 0, 0]} scale={[l.rad * 0.55, 0.006, l.rad * 0.24]} m={leaf} />
          </group>
        </group>
      ))}
    </group>
  )
}

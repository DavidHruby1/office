import { mat } from '../../lib/materials'
import { B, Cyl, Tube, type V3 } from '../primitives'
import type { ModelProps } from './types'

/**
 * Kitchenette. Local frame: back against the wall at z = -D/2, front at +z.
 * Seen from the front, the hob is on the left (−x, window side) and the sink on the right (door side).
 */
export function Kitchen({ item, primary }: ModelProps) {
  const { w: W, d: D, h: H } = item
  const oak = mat('oakArtisan')
  const top = mat('oakGrey')
  const black = mat('black')
  const steel = mat('sinkSteel')
  const back = -D / 2
  const front = D / 2

  const WORK = 0.9 // worktop height
  const TH = 0.038
  const PLINTH = 0.1
  const fz = front - 0.03 // carcass front plane
  const k = W / 1.9
  const units = [0.3, 0.6, 0.5, 0.5].map((u) => u * k)
  const xs: number[] = []
  units.reduce((acc, u, i) => ((xs[i] = acc), acc + u), -W / 2)
  const bodyH = WORK - TH - PLINTH
  const g = 0.004

  // sink cut-out
  const sx = W / 2 - 0.36 * k
  const sw = 0.4, sd = 0.34, sz = 0.02
  const tapX = sx + 0.07

  const upperD = 0.32
  const uz = back + upperD / 2
  const uUnits = [0.6 * k, 0.65 * k, 0.65 * k]
  const uTopLow = H - 0.19
  const uH = 0.4

  const front3 = (x: number, w: number, y0: number, h: number, handle: 'top' | 'none') => (
    <group key={`${x}-${y0}`}>
      <B s={[w - g, h - g, 0.018]} p={[x + w / 2, y0 + h / 2, fz + 0.009]} m={primary} />
      {handle === 'top' && <B s={[0.15, 0.008, 0.02]} p={[x + w / 2, y0 + h - 0.06, fz + 0.03]} m={black} />}
    </group>
  )

  return (
    <group>
      {/* base carcass + plinth */}
      <B s={[W, bodyH - 0.17, D - 0.06]} p={[0, PLINTH + (bodyH - 0.17) / 2, (back + fz) / 2]} m={oak} />
      <B s={[0.018, bodyH, D - 0.06]} p={[-W / 2 + 0.009, PLINTH + bodyH / 2, (back + fz) / 2]} m={oak} />
      <B s={[0.018, bodyH, D - 0.06]} p={[W / 2 - 0.009, PLINTH + bodyH / 2, (back + fz) / 2]} m={oak} />
      <B s={[W, 0.17, 0.018]} p={[0, PLINTH + bodyH - 0.085, fz - 0.009]} m={oak} grain="x" />
      {/* warm edge lines between the black fronts */}
      {[xs[1], xs[2], xs[3]].map((x) => (
        <B key={x} s={[0.004, bodyH, 0.004]} p={[x, PLINTH + bodyH / 2, fz + 0.017]} m={mat('copperEdge')} cast={false} />
      ))}
      {[PLINTH + (bodyH - 0.14) / 2, PLINTH + bodyH - 0.14].map((y) => (
        <B key={y} s={[units[1], 0.004, 0.004]} p={[xs[1] + units[1] / 2, y, fz + 0.017]} m={mat('copperEdge')} cast={false} />
      ))}
      <B s={[W - 0.01, PLINTH, D - 0.12]} p={[0, PLINTH / 2, back + (D - 0.12) / 2]} m={oak} grain="x" />
      {/* fronts */}
      {front3(xs[0], units[0], PLINTH, bodyH, 'none')}
      {front3(xs[1], units[1], PLINTH + bodyH - 0.14, 0.14, 'none')}
      {front3(xs[1], units[1], PLINTH + (bodyH - 0.14) / 2, (bodyH - 0.14) / 2, 'none')}
      {front3(xs[1], units[1], PLINTH, (bodyH - 0.14) / 2, 'none')}
      {front3(xs[2], units[2], PLINTH, bodyH, 'top')}
      {front3(xs[3], units[3], PLINTH, bodyH, 'top')}
      {/* tea towel on the third door */}
      <B s={[0.15, 0.52, 0.012]} p={[xs[2] + 0.1, 0.5, fz + 0.03]} m={mat('duvetWhite')} />
      <B s={[0.03, 0.52, 0.013]} p={[xs[2] + 0.07, 0.5, fz + 0.031]} m={mat('fabricBeige')} />
      <B s={[0.03, 0.52, 0.013]} p={[xs[2] + 0.14, 0.5, fz + 0.031]} m={mat('fabricBeige')} />
      <B s={[0.15, 0.04, 0.013]} p={[xs[2] + 0.1, 0.42, fz + 0.031]} m={mat('fabricBeige')} />
      <B s={[0.15, 0.04, 0.013]} p={[xs[2] + 0.1, 0.56, fz + 0.031]} m={mat('fabricBeige')} />

      {/* worktop in four pieces around the sink cut-out */}
      <B s={[sx - sw / 2 + W / 2, TH, D]} p={[(sx - sw / 2 - W / 2) / 2, WORK - TH / 2, 0]} m={top} grain="x" />
      <B s={[W / 2 - sx - sw / 2, TH, D]} p={[(sx + sw / 2 + W / 2) / 2, WORK - TH / 2, 0]} m={top} grain="x" />
      <B s={[sw, TH, front - (sz + sd / 2)]} p={[sx, WORK - TH / 2, (front + sz + sd / 2) / 2]} m={top} grain="x" />
      <B s={[sw, TH, sz - sd / 2 - back]} p={[sx, WORK - TH / 2, (back + sz - sd / 2) / 2]} m={top} grain="x" />
      {/* steel sink bowl */}
      <B s={[sw, 0.004, sd]} p={[sx, WORK - 0.15, sz]} m={steel} />
      <B s={[0.004, 0.15, sd]} p={[sx - sw / 2 + 0.002, WORK - 0.075, sz]} m={steel} />
      <B s={[0.004, 0.15, sd]} p={[sx + sw / 2 - 0.002, WORK - 0.075, sz]} m={steel} />
      <B s={[sw, 0.15, 0.004]} p={[sx, WORK - 0.075, sz - sd / 2 + 0.002]} m={steel} />
      <B s={[sw, 0.15, 0.004]} p={[sx, WORK - 0.075, sz + sd / 2 - 0.002]} m={steel} />
      {/* rim */}
      <B s={[sw + 0.05, 0.004, 0.027]} p={[sx, WORK + 0.002, sz - sd / 2 - 0.012]} m={steel} />
      <B s={[sw + 0.05, 0.004, 0.027]} p={[sx, WORK + 0.002, sz + sd / 2 + 0.012]} m={steel} />
      <B s={[0.027, 0.004, sd]} p={[sx - sw / 2 - 0.012, WORK + 0.002, sz]} m={steel} />
      <B s={[0.027, 0.004, sd]} p={[sx + sw / 2 + 0.012, WORK + 0.002, sz]} m={steel} />
      <Cyl rad={0.028} h={0.004} p={[sx, WORK - 0.146, sz]} m={mat('anthracite')} />
      {/* tap */}
      <Cyl rad={0.024} h={0.05} p={[tapX, WORK + 0.025, back + 0.085]} m={mat('plasticGrey')} />
      <Cyl rad={0.014} h={0.3} p={[tapX, WORK + 0.19, back + 0.085]} m={mat('plasticGrey')} />
      <mesh position={[tapX, WORK + 0.34, back + 0.085 + 0.075]} rotation={[0, -Math.PI / 2, 0]} material={mat('plasticGrey')} castShadow>
        <torusGeometry args={[0.075, 0.014, 12, 24, Math.PI]} />
      </mesh>
      <Cyl rad={0.014} h={0.05} p={[tapX, WORK + 0.315, back + 0.085 + 0.15]} m={mat('plasticGrey')} />
      <Tube a={[tapX, WORK + 0.05, back + 0.085]} b={[tapX + 0.06, WORK + 0.09, back + 0.085]} rad={0.007} m={mat('plasticGrey')} />
      {/* soap dispenser */}
      <Cyl rad={0.03} h={0.1} p={[sx + 0.19, WORK + 0.05, back + 0.09]} m={mat('glass')} />
      <Cyl rad={0.012} h={0.05} p={[sx + 0.19, WORK + 0.125, back + 0.09]} m={steel} />
      <B s={[0.07, 0.02, 0.045]} p={[sx - 0.06, WORK + 0.014, sz - sd / 2 - 0.035]} m={mat('red')} round={0.006} />

      {/* hob */}
      <B s={[0.5, 0.006, 0.3]} p={[-W / 2 + 0.3, WORK + 0.003, 0.09]} m={mat('blackGloss')} />
      {[-0.12, 0.12].map((z) => (
        <mesh key={z} position={[-W / 2 + 0.3 + z, WORK + 0.0065, 0.09]} rotation={[-Math.PI / 2, 0, 0]} material={mat('plasticGrey')}>
          <ringGeometry args={[0.078, 0.081, 40]} />
        </mesh>
      ))}
      {/* grinders next to the hob */}
      <Cyl rad={0.022} h={0.17} p={[-W / 2 + 0.07, WORK + 0.085, back + 0.06]} m={mat('walnut')} />
      <Cyl rad={0.02} h={0.15} p={[-W / 2 + 0.13, WORK + 0.075, back + 0.055]} m={steel} />
      {/* folded cloth */}
      <B s={[0.2, 0.025, 0.14]} p={[-W / 2 + 0.72, WORK + 0.013, back + 0.14]} m={mat('fabricGreen')} round={0.008} />

      {/* splashback */}
      <B s={[W, 0.72, 0.008]} p={[0, WORK + 0.36, back + 0.004]} m={mat('concrete')} cast={false} />
      {[-W / 2 + W / 3, -W / 2 + (2 * W) / 3].map((x) => (
        <B key={x} s={[0.003, 0.72, 0.0085]} p={[x, WORK + 0.36, back + 0.0045]} m={mat('plasticGrey')} cast={false} />
      ))}
      <B s={[0.16, 0.08, 0.012]} p={[-0.3 * k, WORK + 0.2, back + 0.012]} m={mat('plasticWhite')} round={0.004} />

      {/* wall units: left one (over the hob) sits higher, slim hood below it */}
      <Upper x={-W / 2} w={uUnits[0]} y0={H - uH} h={uH} z={uz} d={upperD} oak={oak} handle={black} />
      <Upper x={-W / 2 + uUnits[0]} w={uUnits[1]} y0={uTopLow - uH} h={uH} z={uz} d={upperD} oak={oak} handle={black} />
      <Upper x={-W / 2 + uUnits[0] + uUnits[1]} w={uUnits[2]} y0={uTopLow - uH} h={uH} z={uz} d={upperD} oak={oak} handle={black} />
      <B s={[uUnits[0] - 0.01, 0.035, 0.47]} p={[-W / 2 + uUnits[0] / 2, H - uH - 0.03, back + 0.235]} m={black} />
      <B s={[uUnits[0] - 0.01, 0.075, 0.3]} p={[-W / 2 + uUnits[0] / 2, H - uH - 0.085, back + 0.15]} m={black} />
      <B s={[uUnits[0] - 0.06, 0.004, 0.36]} p={[-W / 2 + uUnits[0] / 2, H - uH - 0.05, back + 0.26]} m={steel} />
      {/* vase on the middle unit */}
      <Cyl rad={[0.03, 0.055]} h={0.06} p={[-W / 2 + uUnits[0] + 0.1, uTopLow + 0.17, uz]} m={mat('glassSmoke')} />
      <Cyl rad={[0.055, 0.045]} h={0.14} p={[-W / 2 + uUnits[0] + 0.1, uTopLow + 0.07, uz]} m={mat('glassSmoke')} />
    </group>
  )
}

function Upper({ x, w, y0, h, z, d, oak, handle }: { x: number; w: number; y0: number; h: number; z: number; d: number; oak: any; handle: any }) {
  const c: V3 = [x + w / 2, y0 + h / 2, z]
  return (
    <group>
      <B s={[w - 0.002, h, d - 0.02]} p={[c[0], c[1], z - 0.01]} m={oak} grain="x" />
      <B s={[w - 0.004, h - 0.004, 0.018]} p={[c[0], c[1], z + d / 2 - 0.009]} m={oak} grain="x" />
      <B s={[0.15, 0.008, 0.02]} p={[c[0], y0 + 0.07, z + d / 2 + 0.012]} m={handle} />
    </group>
  )
}

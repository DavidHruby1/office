import { Html, Line } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Item } from '../data/types'
import { allConflicts, clearances, cm, corners, dist2, toWorld } from '../lib/geometry'
import { useItems, useStore } from '../state/store'
import { useRotateDrag } from './FurnitureLayer'

const ACCENT = '#3b82f6'
const BAD = '#ef4444'

function Footprint({ item, color, y = 0.012, width = 2 }: { item: Item; color: string; y?: number; width?: number }) {
  const pts = useMemo(() => {
    const c = corners(item)
    return [...c, c[0]].map((p) => [p.x, y, p.z] as [number, number, number])
  }, [item, y])
  return <Line points={pts} color={color} lineWidth={width} depthTest={false} transparent opacity={0.95} renderOrder={10} />
}

function SelectionBox({ item, color }: { item: Item; color: string }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(item.w + 0.01, item.h + 0.01, item.d + 0.01)), [item.w, item.h, item.d])
  return (
    <lineSegments geometry={geo} position={[item.x, item.y + item.h / 2, item.z]} rotation={[0, item.rot, 0]} renderOrder={9}>
      <lineBasicMaterial color={color} transparent opacity={0.55} depthTest={false} />
    </lineSegments>
  )
}

function RotateKnob({ item, color }: { item: Item; color: string }) {
  const start = useRotateDrag()
  const r = item.d / 2 + 0.28
  const p = toWorld(item, 0, r)
  const edge = toWorld(item, 0, item.d / 2)
  return (
    <group>
      <Line points={[[edge.x, 0.014, edge.z], [p.x, 0.014, p.z]]} color={color} lineWidth={1.5} depthTest={false} renderOrder={10} />
      <mesh
        position={[p.x, 0.03, p.z]}
        renderOrder={11}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => start(e, item)}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'alias' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        <sphereGeometry args={[0.055, 20, 14]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
    </group>
  )
}

/** Selection outline, collision warnings, clearance read-outs and measurements in the 3D view. */
export function Overlays() {
  const items = useItems()
  const selectedId = useStore((s) => s.selectedId)
  const showClearance = useStore((s) => s.showClearance)
  const measurements = useStore((s) => s.measurements)
  const pending = useStore((s) => s.measurePending)
  const viewOriginal = useStore((s) => s.viewOriginal)
  const cameraMode = useStore((s) => s.cameraMode)
  const dragging = useStore((s) => s.dragging)
  const sel = items.find((i) => i.id === selectedId && !i.hidden)
  const conflicts = useMemo(() => allConflicts(items), [items])
  const clear = useMemo(() => (sel && showClearance ? clearances(sel, items) : []), [sel, items, showClearance])
  const selBad = !!sel && !!conflicts[sel.id]
  const color = selBad ? BAD : ACCENT

  return (
    <group>
      {Object.keys(conflicts).map((id) => {
        const it = items.find((i) => i.id === id)
        return it && it.id !== selectedId ? <Footprint key={id} item={it} color={BAD} width={2.5} /> : null
      })}
      {sel && (
        <>
          <Footprint item={sel} color={color} width={2.5} />
          <SelectionBox item={sel} color={color} />
          {!sel.locked && !viewOriginal && cameraMode === 'orbit' && <RotateKnob item={sel} color={color} />}
          <Html position={[sel.x, sel.y + sel.h + 0.16, sel.z]} zIndexRange={[20, 0]}>
            <div className="label3d" style={{ background: selBad ? 'rgba(220,38,38,.92)' : 'rgba(37,99,235,.92)' }}>
              {selBad ? '⚠ overlaps · ' : ''}{sel.name} · {Math.round(sel.w * 100)}×{Math.round(sel.d * 100)}×{Math.round(sel.h * 100)} cm
            </div>
          </Html>
          {clear.filter((c) => c.dist > 0.03).map((c) => (
            <group key={c.side}>
              <Line points={[[c.from.x, 0.016, c.from.z], [c.to.x, 0.016, c.to.z]]} color="#f59e0b" lineWidth={1.5} dashed dashSize={0.06} gapSize={0.04} depthTest={false} renderOrder={10} />
              {!dragging || c.dist > 0.12 ? (
                <Html position={[(c.from.x + c.to.x) / 2, 0.02, (c.from.z + c.to.z) / 2]} zIndexRange={[10, 0]}>
                  <div className="label3d" style={{ background: 'rgba(180,83,9,.9)' }}>{cm(c.dist)}</div>
                </Html>
              ) : null}
            </group>
          ))}
        </>
      )}
      {measurements.map((m, i) => (
        <group key={i}>
          <Line points={[[m.a.x, 0.02, m.a.z], [m.b.x, 0.02, m.b.z]]} color="#10b981" lineWidth={2.5} depthTest={false} renderOrder={12} />
          {[m.a, m.b].map((p, j) => (
            <mesh key={j} position={[p.x, 0.02, p.z]} renderOrder={12}>
              <sphereGeometry args={[0.025, 12, 8]} />
              <meshBasicMaterial color="#10b981" depthTest={false} />
            </mesh>
          ))}
          <Html position={[(m.a.x + m.b.x) / 2, 0.03, (m.a.z + m.b.z) / 2]} zIndexRange={[15, 0]}>
            <div className="label3d" style={{ background: 'rgba(4,120,87,.95)' }}>{cm(dist2(m.a, m.b))}</div>
          </Html>
        </group>
      ))}
      {pending && (
        <mesh position={[pending.x, 0.02, pending.z]} renderOrder={12}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshBasicMaterial color="#10b981" depthTest={false} />
        </mesh>
      )}
    </group>
  )
}

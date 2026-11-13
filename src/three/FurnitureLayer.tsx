import { useThree, type ThreeEvent } from '@react-three/fiber'
import { memo, useCallback, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CATALOG } from '../data/catalog'
import { facing } from '../data/room'
import type { Item } from '../data/types'
import { findConflicts, hasConflict, normAngle, resolveMove } from '../lib/geometry'
import { mat } from '../lib/materials'
import { getShownItems, useItems, useStore } from '../state/store'
import { GRID, settleMove, warnIfConflict } from '../state/editing'
import { MODELS } from './furniture'


/** The mesh tree of one item only depends on type / size / finish – not on its position. */
const Model = memo(function Model({ type, w, d, h, finish, color }: Pick<Item, 'type' | 'w' | 'd' | 'h' | 'finish' | 'color'>) {
  const C = MODELS[type]
  const primary = mat(finish ?? CATALOG[type].defaultFinish, color)
  const item = useMemo(() => ({ type, w, d, h }) as Item, [type, w, d, h])
  return <C item={item} primary={primary} />
})

/** Converts a DOM pointer event into a ray and intersects it with a horizontal plane. */
export function useFloorPointer() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const ray = useMemo(() => new THREE.Raycaster(), [])
  return useCallback(
    (clientX: number, clientY: number, planeY: number): THREE.Vector3 | null => {
      const r = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), hit) ? hit : null
    },
    [camera, gl, ray],
  )
}

/** Shared drag gesture for moving an item over the floor (used by the 3D view). */
export function useItemDrag() {
  const floorPoint = useFloorPointer()
  const controls = useThree((s) => s.controls) as any
  const gesture = useRef<{ cleanup: () => void } | null>(null)

  return useCallback(
    (e: ThreeEvent<PointerEvent>, item: Item) => {
      const st = useStore.getState()
      if (st.tool !== 'select' || st.cameraMode !== 'orbit' || e.button !== 0) return
      e.stopPropagation()
      st.select(item.id)
      if (item.locked || st.viewOriginal) return
      if (controls) controls.enabled = false // before OrbitControls sees this pointerdown

      const planeY = e.point.y
      const off = { x: item.x - e.point.x, z: item.z - e.point.z }
      const start = { x: item.x, z: item.z }
      const sx = e.nativeEvent.clientX
      const sy = e.nativeEvent.clientY
      let moved = false
      let lastValid = start

      const move = (ev: PointerEvent) => {
        if (!moved) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return
          moved = true
          useStore.getState().checkpoint()
          useStore.getState().set({ dragging: true })
          document.body.style.cursor = 'grabbing'
        }
        const hit = floorPoint(ev.clientX, ev.clientY, planeY)
        if (!hit) return
        const s = useStore.getState()
        const cur = s.items.find((i) => i.id === item.id)
        if (!cur) return
        const p = resolveMove(cur, hit.x + off.x, hit.z + off.z, { gridSnap: s.gridSnap && !ev.altKey, wallSnap: s.wallSnap && !ev.altKey, grid: GRID })
        const next = { ...cur, ...p }
        if (!hasConflict(findConflicts(next, s.items))) lastValid = p
        s.patchItem(item.id, p)
      }
      const up = () => {
        gesture.current?.cleanup()
        gesture.current = null
        if (controls) controls.enabled = useStore.getState().cameraMode === 'orbit'
        document.body.style.cursor = ''
        if (!moved) return
        const s = useStore.getState()
        s.set({ dragging: false })
        settleMove(item.id, lastValid)
      }
      const cleanup = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
      }
      gesture.current?.cleanup()
      gesture.current = { cleanup }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [controls, floorPoint],
  )
}

/** Drag gesture of the rotation knob. */
export function useRotateDrag() {
  const floorPoint = useFloorPointer()
  const controls = useThree((s) => s.controls) as any
  return useCallback(
    (e: ThreeEvent<PointerEvent>, item: Item) => {
      e.stopPropagation()
      if (controls) controls.enabled = false
      let started = false
      const move = (ev: PointerEvent) => {
        const hit = floorPoint(ev.clientX, ev.clientY, 0.02)
        if (!hit) return
        if (!started) { started = true; useStore.getState().checkpoint(); useStore.getState().set({ dragging: true }) }
        let a = facing(hit.x - item.x, hit.z - item.z)
        const step = ((ev.shiftKey ? 45 : 5) * Math.PI) / 180
        if (!ev.altKey) a = Math.round(a / step) * step
        useStore.getState().patchItem(item.id, { rot: normAngle(a) })
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        if (controls) controls.enabled = useStore.getState().cameraMode === 'orbit'
        const s = useStore.getState()
        s.set({ dragging: false })
        if (started) warnIfConflict(item.id)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [controls, floorPoint],
  )
}

function FurnitureObject({ item, dimmed }: { item: Item; dimmed: boolean }) {
  const startDrag = useItemDrag()
  const onDown = (e: ThreeEvent<PointerEvent>) => startDrag(e, item)
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const st = useStore.getState()
    e.stopPropagation() // otherwise the floor behind the furniture would receive the click and deselect
    if (st.tool === 'measure' && e.delta < 4) st.addMeasurePoint({ x: e.point.x, z: e.point.z })
  }
  const over = (e: ThreeEvent<PointerEvent>) => {
    const st = useStore.getState()
    if (st.tool === 'select' && st.cameraMode === 'orbit' && !st.dragging) {
      e.stopPropagation()
      document.body.style.cursor = item.locked || st.viewOriginal ? 'pointer' : 'grab'
    }
  }
  const out = () => { if (!useStore.getState().dragging) document.body.style.cursor = '' }
  return (
    <group
      position={[item.x, item.y, item.z]}
      rotation={[0, item.rot, 0]}
      visible={!dimmed}
      onPointerDown={dimmed ? undefined : onDown}
      onClick={dimmed ? undefined : onClick}
      onPointerOver={dimmed ? undefined : over}
      onPointerOut={out}
      userData={{ itemId: item.id }}
    >
      <Model type={item.type} w={item.w} d={item.d} h={item.h} finish={item.finish} color={item.color} />
    </group>
  )
}

const MemoObject = memo(FurnitureObject)

/** Renders every movable item from the shared store. */
export function FurnitureLayer() {
  const items = useItems()
  const isolatedId = useStore((s) => s.isolatedId)
  return (
    <group>
      {items.map((it) =>
        it.hidden ? null : <MemoObject key={it.id} item={it} dimmed={!!isolatedId && isolatedId !== it.id} />,
      )}
    </group>
  )
}

export { getShownItems }

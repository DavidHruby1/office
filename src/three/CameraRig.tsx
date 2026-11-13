import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { DEFAULT_VIEW, type CameraPose } from '../data/referenceViews'
import { ROOM } from '../data/room'
import { walkBlocked } from '../lib/geometry'
import { getShownItems, useStore } from '../state/store'

const EYE = 1.62
const RADIUS = 0.2
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

interface Flight {
  t: number
  dur: number
  p0: THREE.Vector3
  p1: THREE.Vector3
  t0: THREE.Vector3
  t1: THREE.Vector3
  f0: number
  f1: number
}

/** Orbit / pan / zoom, animated transitions between views, and the first-person walkthrough. */
export function CameraRig({ initial }: { initial: CameraPose }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const controls = useRef<any>(null)
  const cameraMode = useStore((s) => s.cameraMode)
  const cameraCmd = useStore((s) => s.cameraCmd)
  const flight = useRef<Flight | null>(null)
  const lastOrbit = useRef<CameraPose>(initial)
  const keys = useRef<Record<string, boolean>>({})
  const look = useRef({ yaw: 0, pitch: 0, dragging: false })

  // initial pose
  useEffect(() => {
    camera.position.set(...initial.position)
    camera.fov = initial.fov ?? 45
    camera.updateProjectionMatrix()
    controls.current?.target.set(...initial.target)
    controls.current?.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // fly-to commands
  useEffect(() => {
    if (!cameraCmd) return
    const { pose } = cameraCmd
    const c = controls.current
    const curTarget = c ? c.target.clone() : new THREE.Vector3(...pose.target)
    if (useStore.getState().cameraMode === 'walk') {
      // looking direction → a target 2 m ahead, so the flight starts from the walking view
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      curTarget.copy(camera.position).addScaledVector(dir, 2)
    }
    flight.current = {
      t: 0,
      dur: 0.9,
      p0: camera.position.clone(),
      p1: new THREE.Vector3(...pose.position),
      t0: curTarget,
      t1: new THREE.Vector3(...pose.target),
      f0: camera.fov,
      f1: pose.fov ?? camera.fov,
    }
    invalidate()
  }, [cameraCmd, camera, invalidate])

  // enter / leave walk mode
  useEffect(() => {
    const c = controls.current
    if (cameraMode === 'walk') {
      if (c) lastOrbit.current = { position: camera.position.toArray() as any, target: c.target.toArray(), fov: camera.fov }
      // start where the camera is looking, if that is a free spot inside the room
      const items = getShownItems()
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      let start = { x: 2.6, z: 1.45 }
      const cand = c ? { x: c.target.x, z: c.target.z } : start
      for (const p of [{ x: camera.position.x, z: camera.position.z }, cand]) {
        if (!walkBlocked(p, RADIUS, items)) { start = p; break }
      }
      const yaw = Math.atan2(-dir.x, -dir.z)
      look.current.yaw = Math.abs(dir.y) > 0.95 ? -Math.PI / 2 : yaw
      look.current.pitch = 0
      const fwd = new THREE.Vector3(-Math.sin(look.current.yaw), 0, -Math.cos(look.current.yaw))
      flight.current = {
        t: 0, dur: 0.9,
        p0: camera.position.clone(), p1: new THREE.Vector3(start.x, EYE, start.z),
        t0: c ? c.target.clone() : new THREE.Vector3(), t1: new THREE.Vector3(start.x, EYE, start.z).addScaledVector(fwd, 2),
        f0: camera.fov, f1: 68,
      }
      try { gl.domElement.requestPointerLock()?.catch?.(() => {}) } catch { /* drag-to-look fallback */ }
      invalidate()
    } else if (document.pointerLockElement === gl.domElement) {
      document.exitPointerLock()
    }
  }, [cameraMode, camera, gl, invalidate])

  // walk-mode input
  useEffect(() => {
    if (cameraMode !== 'walk') return
    const el = gl.domElement
    const leave = () => {
      useStore.getState().set({ cameraMode: 'orbit' })
      useStore.getState().flyTo(lastOrbit.current)
    }
    const kd = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (e.code === 'Escape') leave()
    }
    const ku = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const mm = (e: MouseEvent) => {
      const locked = document.pointerLockElement === el
      if (!locked && !look.current.dragging) return
      look.current.yaw -= e.movementX * 0.0024
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - e.movementY * 0.0024, -1.35, 1.35)
    }
    const md = () => {
      look.current.dragging = true
      if (document.pointerLockElement !== el) { try { el.requestPointerLock()?.catch?.(() => {}) } catch { /* ignore */ } }
    }
    const mu = () => { look.current.dragging = false }
    let wasLocked = document.pointerLockElement === el
    const plc = () => {
      const locked = document.pointerLockElement === el
      if (wasLocked && !locked) leave() // Esc pressed while locked
      wasLocked = locked
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('mousemove', mm)
    el.addEventListener('mousedown', md)
    window.addEventListener('mouseup', mu)
    document.addEventListener('pointerlockchange', plc)
    return () => {
      keys.current = {}
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('mousemove', mm)
      el.removeEventListener('mousedown', md)
      window.removeEventListener('mouseup', mu)
      document.removeEventListener('pointerlockchange', plc)
    }
  }, [cameraMode, gl])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const c = controls.current
    const st = useStore.getState()
    const f = flight.current
    // the canvas renders on demand: keep the loop alive only while something is moving
    if (f || st.cameraMode === 'walk') invalidate()
    if (f) {
      f.t = Math.min(1, f.t + dt / f.dur)
      const k = ease(f.t)
      camera.position.lerpVectors(f.p0, f.p1, k)
      const tgt = new THREE.Vector3().lerpVectors(f.t0, f.t1, k)
      camera.fov = THREE.MathUtils.lerp(f.f0, f.f1, k)
      camera.updateProjectionMatrix()
      camera.up.set(0, 1, 0)
      camera.lookAt(tgt)
      if (c) c.target.copy(tgt)
      if (f.t >= 1) {
        flight.current = null
        if (st.cameraMode === 'orbit' && c) c.update()
      }
      return
    }
    if (st.cameraMode === 'walk') {
      const k = keys.current
      const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
      const side = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
      const { yaw, pitch } = look.current
      if (fwd || side) {
        const speed = (k.ShiftLeft || k.ShiftRight ? 2.6 : 1.4) * dt
        const len = Math.hypot(fwd, side)
        const dx = ((-Math.sin(yaw) * fwd + Math.cos(yaw) * side) / len) * speed
        const dz = ((-Math.cos(yaw) * fwd - Math.sin(yaw) * side) / len) * speed
        const items = getShownItems()
        const p = camera.position
        // slide along obstacles: try the full step, then each axis on its own
        if (!walkBlocked({ x: p.x + dx, z: p.z + dz }, RADIUS, items)) { p.x += dx; p.z += dz }
        else if (!walkBlocked({ x: p.x + dx, z: p.z }, RADIUS, items)) p.x += dx
        else if (!walkBlocked({ x: p.x, z: p.z + dz }, RADIUS, items)) p.z += dz
      }
      camera.position.y = EYE
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={cameraMode === 'orbit'}
      enableDamping
      dampingFactor={0.09}
      minDistance={0.25}
      maxDistance={26}
      maxPolarAngle={Math.PI / 2 - 0.01}
      zoomSpeed={0.9}
      panSpeed={0.9}
      rotateSpeed={0.75}
      screenSpacePanning
      target={DEFAULT_VIEW.target}
    />
  )
}

export const ROOM_CENTER: [number, number, number] = [ROOM.length / 2, 0.6, 1.2]

import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import { DEFAULT_VIEW, REFERENCE_VIEWS, type CameraPose } from '../data/referenceViews'
import { disposeMaterials } from '../lib/materials'
import { useStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { FurnitureLayer } from './FurnitureLayer'
import { Lighting } from './Lighting'
import { Overlays } from './Overlays'
import { disposeGeometries } from './primitives'
import { RoomShell } from './RoomShell'

function download(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}

/** Saves the current frame as PNG whenever the store's screenshot counter changes. */
function Screenshot() {
  const gl = useThree((s) => s.gl)
  const nonce = useStore((s) => s.screenshotNonce)
  useEffect(() => {
    if (!nonce) return
    // wait for the next rendered frame so overlays/selection changes are included
    const id = requestAnimationFrame(() => {
      gl.domElement.toBlob((b) => {
        if (!b) return
        const url = URL.createObjectURL(b)
        download(url, `room-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }, 'image/png')
    })
    return () => cancelAnimationFrame(id)
  }, [nonce, gl])
  return null
}

/** Test hook: lets automated checks project world points to the screen. */
function DebugHook() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => { (window as any).__twin3d = { camera, gl } }, [camera, gl])
  return null
}

function Cleanup() {
  useEffect(() => () => { disposeMaterials(); disposeGeometries() }, [])
  return null
}

export function Scene() {
  const lighting = useStore((s) => s.lighting)
  const cameraMode = useStore((s) => s.cameraMode)
  const tool = useStore((s) => s.tool)
  const initial: CameraPose = useMemo(() => {
    const id = new URLSearchParams(location.search).get('view')
    return REFERENCE_VIEWS.find((v) => v.id === id) ?? DEFAULT_VIEW
  }, [])

  const onArchClick = (e: any) => {
    const st = useStore.getState()
    if (e.delta > 4) return // it was a camera drag, not a click
    // three.js still ray-hits hidden meshes (wall attachments hidden from outside) – let those clicks pass through
    for (let o = e.object; o; o = o.parent) if (!o.visible) return
    if (st.tool === 'measure') {
      e.stopPropagation()
      st.addMeasurePoint({ x: e.point.x, z: e.point.z })
    } else if (st.cameraMode === 'orbit') {
      st.select(null)
    }
  }

  return (
    <Canvas
      shadows="soft"
      frameloop="demand"
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      camera={{ fov: initial.fov ?? 45, near: 0.05, far: 80, position: initial.position }}
      onPointerMissed={() => { if (useStore.getState().tool === 'select') useStore.getState().select(null) }}
      style={{ cursor: tool === 'measure' ? 'crosshair' : cameraMode === 'walk' ? 'none' : undefined }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <group onClick={onArchClick}>
          <RoomShell />
        </group>
        <FurnitureLayer />
        <Overlays />
        <CameraRig initial={initial} />
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <N8AO aoRadius={0.55} intensity={2.4} distanceFalloff={1} quality="medium" halfRes />
          <Bloom intensity={lighting === 'evening' ? 0.25 : 0.12} luminanceThreshold={1.2} luminanceSmoothing={0.3} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
        <Screenshot />
        <DebugHook />
        <Cleanup />
      </Suspense>
    </Canvas>
  )
}

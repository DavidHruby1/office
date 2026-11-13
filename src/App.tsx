import { Trash2, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { REFERENCE_VIEWS } from './data/referenceViews'
import { allConflicts } from './lib/geometry'
import { useItems, useStore } from './state/store'
import { Scene } from './three/Scene'
import { FloorPlan2D } from './two/FloorPlan2D'
import { Help } from './ui/Help'
import { Inspector } from './ui/Inspector'
import { ObjectPanel } from './ui/ObjectPanel'
import { Toolbar } from './ui/Toolbar'
import { useShortcuts } from './ui/useShortcuts'

function Toast() {
  const toast = useStore((s) => s.toast)
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    setShown(toast.text)
    const id = setTimeout(() => setShown(null), 4200)
    return () => clearTimeout(id)
  }, [toast])
  if (!shown) return null
  return (
    <div role="status" className="pointer-events-none absolute bottom-14 left-1/2 z-40 max-w-[560px] -translate-x-1/2 rounded-xl bg-stone-900/92 px-4 py-2.5 text-center text-[12.5px] font-medium text-white shadow-xl">
      {shown}
    </div>
  )
}

function StatusBar() {
  const items = useItems()
  const tool = useStore((s) => s.tool)
  const cameraMode = useStore((s) => s.cameraMode)
  const viewOriginal = useStore((s) => s.viewOriginal)
  const measurements = useStore((s) => s.measurements)
  const pending = useStore((s) => s.measurePending)
  const selectedId = useStore((s) => s.selectedId)
  const blockInvalid = useStore((s) => s.blockInvalid)
  const conflicts = useMemo(() => Object.keys(allConflicts(items)).length, [items])
  const st = useStore.getState()

  let hint = 'Click furniture to select · drag to move · drag the knob to rotate · right-drag pans the camera'
  if (cameraMode === 'walk') hint = 'Walking: W A S D to move · mouse to look (click to capture) · Shift = faster · Esc = leave'
  else if (tool === 'measure') hint = pending ? 'Click the second point' : 'Measure: click two points on the floor, walls of furniture or in the 2D plan'
  else if (viewOriginal) hint = 'Original layout as photographed (read-only) – switch to “My layout” to edit'
  else if (selectedId) hint = 'Drag to move · R rotates 15° · arrows nudge 1 cm · Ctrl+D duplicates · Delete removes'

  return (
    <footer className="panel pointer-events-auto flex h-9 items-center gap-3 px-3 text-[11.5px] text-stone-600">
      <span className="truncate">{hint}</span>
      <span className="flex-1" />
      {measurements.length > 0 && (
        <button className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline" onClick={st.clearMeasurements}><Trash2 size={12} />Clear {measurements.length} measurement{measurements.length > 1 ? 's' : ''}</button>
      )}
      {conflicts > 0 && <span className="flex items-center gap-1 font-semibold text-red-600"><TriangleAlert size={13} />{conflicts} overlapping</span>}
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5" title="When on, dropping furniture onto a wall or another object puts it back at the last free position">
        <input type="checkbox" checked={blockInvalid} onChange={(e) => st.set({ blockInvalid: e.target.checked })} /> Block overlaps
      </label>
      <button className="shrink-0 font-semibold text-stone-500 hover:text-red-600" title="Throw away all edits and return to the photographed layout (can be undone)" onClick={() => { st.resetLayout(); st.notify('Layout reset to the original. Ctrl+Z brings your edits back.') }}>
        Reset layout
      </button>
    </footer>
  )
}

export default function App() {
  const viewMode = useStore((s) => s.viewMode)
  const [help, setHelp] = useState(false)
  const toggleHelp = useCallback(() => setHelp((h) => !h), [])
  useShortcuts(toggleHelp)

  // ?ui=0 hides the interface (clean captures), ?light=day|evening, ?view=<reference id>
  const params = useMemo(() => new URLSearchParams(location.search), [])
  const bare = params.get('ui') === '0'
  useEffect(() => {
    const light = params.get('light')
    if (light === 'day' || light === 'evening') useStore.getState().set({ lighting: light })
    if (params.get('view') && REFERENCE_VIEWS.some((v) => v.id === params.get('view'))) useStore.getState().set({ viewMode: '3d' })
    ;(window as any).__twin = { store: useStore, views: REFERENCE_VIEWS }
  }, [params])

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex">
        {viewMode !== '2d' && (
          <div className="relative h-full min-w-0" style={{ flex: viewMode === 'split' ? '1.35 1 0' : '1 1 0' }}>
            <Scene />
          </div>
        )}
        {viewMode !== '3d' && (
          <div className="relative h-full min-w-0 border-l border-black/20" style={{ flex: '1 1 0' }}>
            <FloorPlan2D />
          </div>
        )}
      </div>

      {!bare && (
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-2.5 p-3">
          <div className="flex justify-center"><Toolbar onHelp={toggleHelp} /></div>
          <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
            <ObjectPanel />
            <Inspector />
          </div>
          <StatusBar />
          <Toast />
        </div>
      )}
      {help && <Help onClose={() => setHelp(false)} />}
    </div>
  )
}

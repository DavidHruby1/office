import {
  Armchair, Box, Camera, ChevronDown, CircleHelp, Columns2, Download, Footprints, Grid3x3, History, Magnet, Map as MapIcon,
  MousePointer2, Moon, Orbit, Redo2, RotateCcw, Ruler, ScanEye, Square, Sun, Undo2, Upload, View,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { DEFAULT_VIEW, ISO_VIEW, REFERENCE_VIEWS, TOP_VIEW } from '../data/referenceViews'
import { useStore } from '../state/store'
import { Divider, IconButton, Segmented } from './controls'

export function exportJson() {
  const data = useStore.getState().exportLayout()
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `room-layout-${data.savedAt.slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  useStore.getState().notify('Layout exported as JSON.')
}

export function Toolbar({ onHelp }: { onHelp: () => void }) {
  const s = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [viewsOpen, setViewsOpen] = useState(false)
  const has3d = s.viewMode !== '2d'
  const fly = (pose: typeof DEFAULT_VIEW) => {
    if (s.cameraMode === 'walk') s.set({ cameraMode: 'orbit' })
    if (!has3d) s.set({ viewMode: '3d' })
    s.flyTo(pose)
  }

  const onImport = async (f: File | undefined) => {
    if (!f) return
    if (f.size > 1024 * 1024) {
      s.notify('Layout files must be smaller than 1 MB.')
      if (file.current) file.current.value = ''
      return
    }
    try {
      const ok = s.importLayout(JSON.parse(await f.text()))
      s.notify(ok ? `Imported “${f.name}”.` : 'That file is not a Room Twin layout.')
    } catch {
      s.notify('Could not read that file (invalid JSON).')
    }
    if (file.current) file.current.value = ''
  }

  return (
    <header className="panel pointer-events-auto flex h-11 items-center gap-0.5 px-2">
      <div className="mr-1 flex items-center gap-2 pl-1 pr-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-white"><Armchair size={14} /></div>
        <span className="hidden text-[13px] font-bold tracking-tight text-stone-900 xl:block">Room Twin</span>
      </div>
      <Segmented
        value={s.viewMode}
        onChange={(v) => s.set({ viewMode: v, ...(v === '2d' && s.cameraMode === 'walk' ? { cameraMode: 'orbit' as const } : {}) })}
        options={[
          { value: '3d', label: <><Box size={13} />3D</>, title: '3D view (1)' },
          { value: '2d', label: <><MapIcon size={13} />2D</>, title: '2D floor plan (2)' },
          { value: 'split', label: <><Columns2 size={13} />Split</>, title: 'Both, side by side (3)' },
        ]}
      />
      <Divider />
      <IconButton label="Orbit · drag = rotate, right-drag = pan, wheel = zoom" active={has3d && s.cameraMode === 'orbit'} disabled={!has3d} onClick={() => s.set({ cameraMode: 'orbit' })}><Orbit size={16} /></IconButton>
      <IconButton label="Walk through · WASD + mouse, Esc to leave" kbd="F" active={s.cameraMode === 'walk'} disabled={!has3d} onClick={() => s.set({ cameraMode: s.cameraMode === 'walk' ? 'orbit' : 'walk', tool: 'select' })}><Footprints size={16} /></IconButton>
      <IconButton label="Top-down view" kbd="T" onClick={() => fly(TOP_VIEW)}><Square size={15} /></IconButton>
      <IconButton label="Isometric overview" kbd="I" onClick={() => fly(ISO_VIEW)}><View size={16} /></IconButton>
      <IconButton label="Reset camera" kbd="Home" onClick={() => fly(DEFAULT_VIEW)}><RotateCcw size={15} /></IconButton>
      <div className="relative">
        <IconButton label="Photo viewpoints" active={viewsOpen} onClick={() => setViewsOpen((o) => !o)}><ScanEye size={16} /><ChevronDown size={11} /></IconButton>
        {viewsOpen && (
          <div className="panel absolute left-0 top-[calc(100%+8px)] z-40 w-56 p-1.5" onMouseLeave={() => setViewsOpen(false)}>
            <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">Reference photo viewpoints</div>
            {REFERENCE_VIEWS.map((v) => (
              <button key={v.id} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-stone-700 hover:bg-stone-900/6" onClick={() => { fly(v); setViewsOpen(false) }}>
                {v.label}
                <span className="font-mono text-[9.5px] text-stone-400">{v.photo.slice(-6)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Divider />
      <IconButton label="Select & move" kbd="V" active={s.tool === 'select'} onClick={() => s.set({ tool: 'select' })}><MousePointer2 size={15} /></IconButton>
      <IconButton label="Measure distance · click two points" kbd="M" active={s.tool === 'measure'} onClick={() => s.set({ tool: s.tool === 'measure' ? 'select' : 'measure', cameraMode: 'orbit' })}><Ruler size={15} /></IconButton>
      <IconButton label="Snap to 10 cm grid" kbd="G" active={s.gridSnap} onClick={() => s.set({ gridSnap: !s.gridSnap })}><Grid3x3 size={15} /></IconButton>
      <IconButton label="Snap to walls" kbd="W" active={s.wallSnap} onClick={() => s.set({ wallSnap: !s.wallSnap })}><Magnet size={15} /></IconButton>
      <Divider />
      <Segmented
        value={s.viewOriginal ? 'orig' : 'edit'}
        onChange={(v) => s.set({ viewOriginal: v === 'orig' })}
        options={[
          { value: 'edit', label: 'My layout', title: 'Your edited arrangement (O)' },
          { value: 'orig', label: <><History size={12} />Original</>, title: 'The room as photographed – read-only (O)' },
        ]}
      />
      <Divider />
      <IconButton label="Undo" kbd="Ctrl Z" disabled={!s.past.length || s.viewOriginal} onClick={s.undo}><Undo2 size={16} /></IconButton>
      <IconButton label="Redo" kbd="Ctrl Y" disabled={!s.future.length || s.viewOriginal} onClick={s.redo}><Redo2 size={16} /></IconButton>
      <Divider />
      <IconButton label={s.lighting === 'evening' ? 'Lighting: evening (as photographed) – switch to daylight' : 'Lighting: daylight – switch to evening'} kbd="L" onClick={() => s.set({ lighting: s.lighting === 'evening' ? 'day' : 'evening' })}>
        {s.lighting === 'evening' ? <Moon size={15} /> : <Sun size={15} />}
      </IconButton>
      <IconButton label="Save screenshot of the 3D view" kbd="P" disabled={!has3d} onClick={() => s.set({ screenshotNonce: s.screenshotNonce + 1 })}><Camera size={16} /></IconButton>
      <IconButton label="Export layout (JSON)" kbd="Ctrl S" onClick={exportJson}><Download size={15} /></IconButton>
      <IconButton label="Import layout (JSON)" onClick={() => file.current?.click()}><Upload size={15} /></IconButton>
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
      <IconButton label="Help & shortcuts" kbd="?" onClick={onHelp}><CircleHelp size={16} /></IconButton>
    </header>
  )
}

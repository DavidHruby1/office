import { X } from 'lucide-react'

const ROWS: [string, string][] = [
  ['Click', 'Select furniture (3D or 2D)'],
  ['Drag furniture', 'Move it across the floor'],
  ['Drag the round knob', 'Rotate (5° steps · Shift 45° · Alt free)'],
  ['Alt while dragging', 'Temporarily disable snapping'],
  ['R / Shift+R', 'Rotate selection ±15°'],
  ['Arrow keys', 'Nudge 1 cm (Shift: 10 cm)'],
  ['Ctrl+D · Delete', 'Duplicate · delete selection'],
  ['H', 'Hide / show selection'],
  ['Ctrl+Z · Ctrl+Y', 'Undo · redo'],
  ['Ctrl+S', 'Export layout as JSON'],
  ['1 · 2 · 3', '3D · 2D · split view'],
  ['T · I · Home', 'Top · isometric · reset camera'],
  ['F', 'Walk-through (WASD + mouse, Shift = faster, Esc = leave)'],
  ['V · M', 'Select tool · measure tool'],
  ['G · W', 'Grid snapping · wall snapping'],
  ['O', 'Original layout ↔ my layout'],
  ['L · P', 'Day/evening lighting · screenshot'],
  ['Esc', 'Deselect / cancel measuring'],
]

export function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="panel thin-scroll max-h-full w-[560px] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-stone-900">How to use Room Twin</h2>
          <button className="text-stone-400 hover:text-stone-800" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="mb-3 text-[12.5px] leading-relaxed text-stone-600">
          This is a to-scale reconstruction of the room from the floor-plan sketch and photographs. <b>Orbit:</b> left-drag rotates, right-drag (or Ctrl-drag)
          pans, wheel zooms. Everything you move is stored in your browser automatically; “Original” always shows the room as photographed.
          Placements that would overlap a wall or other furniture are outlined in red and, by default, revert to the last free position.
        </p>
        <div className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
          {ROWS.map(([k, v]) => (
            <div key={k} className="contents">
              <div><span className="rounded bg-stone-900/8 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-stone-700">{k}</span></div>
              <div className="text-stone-600">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

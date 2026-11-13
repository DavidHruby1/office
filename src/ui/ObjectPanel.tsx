import { Eye, EyeOff, Lock, PanelLeftClose, PanelLeftOpen, Plus, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATALOG } from '../data/catalog'
import type { FurnitureType } from '../data/types'
import { allConflicts } from '../lib/geometry'
import { useItems, useStore } from '../state/store'

const EXTRAS: FurnitureType[] = ['desk', 'chair', 'bookshelf', 'armchair', 'plant', 'rug']
const ALSO: FurnitureType[] = ['sofa', 'bed', 'wardrobe', 'dresser', 'coffeeTable', 'fridge', 'tv', 'wallCabinets', 'fan', 'basket']

export function ObjectPanel() {
  const items = useItems()
  const open = useStore((s) => s.leftOpen)
  const selectedId = useStore((s) => s.selectedId)
  const viewOriginal = useStore((s) => s.viewOriginal)
  const set = useStore((s) => s.set)
  const [adding, setAdding] = useState(false)
  const conflicts = useMemo(() => allConflicts(items), [items])

  if (!open) {
    return (
      <button className="panel pointer-events-auto flex h-9 w-9 items-center justify-center text-stone-600 hover:text-stone-900" title="Show object list" onClick={() => set({ leftOpen: true })}>
        <PanelLeftOpen size={16} />
      </button>
    )
  }
  return (
    <aside className="panel pointer-events-auto flex max-h-full w-56 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
        <h2 className="text-[12.5px] font-bold text-stone-900">Objects <span className="ml-1 font-medium text-stone-400">{items.length}</span></h2>
        <button className="text-stone-400 hover:text-stone-800" title="Collapse panel" onClick={() => set({ leftOpen: false })}><PanelLeftClose size={15} /></button>
      </div>
      <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
        {items.map((it) => {
          const sel = it.id === selectedId
          return (
            <li key={it.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => useStore.getState().select(sel ? null : it.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') useStore.getState().select(it.id) }}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-[5px] text-[12px] ${sel ? 'bg-blue-600 text-white' : 'text-stone-700 hover:bg-stone-900/6'} ${it.hidden ? 'opacity-50' : ''}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border border-black/15" style={{ background: it.color ?? CATALOG[it.type].plan }} />
                <span className="min-w-0 flex-1 truncate font-medium">{it.name}</span>
                {conflicts[it.id] && <TriangleAlert size={12} className={sel ? 'text-white' : 'text-red-500'} />}
                {it.locked && <Lock size={11} className="opacity-60" />}
                {!viewOriginal && (
                  <button
                    title={it.hidden ? 'Show' : 'Hide'}
                    className={`shrink-0 ${it.hidden ? '' : 'opacity-0 group-hover:opacity-70'} hover:!opacity-100`}
                    onClick={(e) => { e.stopPropagation(); useStore.getState().updateItem(it.id, { hidden: !it.hidden }) }}
                  >
                    {it.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-stone-900/8 p-2">
        <button
          disabled={viewOriginal}
          onClick={() => setAdding((a) => !a)}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 text-[12px] font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} /> Add furniture
        </button>
        {adding && !viewOriginal && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {[...EXTRAS, ...ALSO].map((t) => (
              <button
                key={t}
                className="truncate rounded-md border border-stone-900/10 px-1.5 py-1 text-left text-[11px] font-medium text-stone-700 hover:bg-stone-900/6"
                title={`${CATALOG[t].label} · ${Math.round(CATALOG[t].w * 100)}×${Math.round(CATALOG[t].d * 100)} cm`}
                onClick={() => { useStore.getState().addItem(t); setAdding(false) }}
              >
                {CATALOG[t].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

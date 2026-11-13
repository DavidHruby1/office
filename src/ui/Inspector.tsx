import { Copy, Eye, EyeOff, Focus, Lock, LockOpen, PanelRightClose, RotateCcw, RotateCw, Trash2, TriangleAlert, Undo } from 'lucide-react'
import { useMemo } from 'react'
import { CATALOG } from '../data/catalog'
import { originalById } from '../data/originalLayout'
import { clearances, cm, deg, findConflicts, hasConflict, normAngle, rad } from '../lib/geometry'
import { FINISH_LABELS, FINISH_SWATCH } from '../lib/materials'
import { describeConflict } from '../state/editing'
import { useItems, useStore } from '../state/store'
import { NumberField, Section, SmallButton } from './controls'

const SIDE_LABEL = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' } as const

export function Inspector() {
  const items = useItems()
  const selectedId = useStore((s) => s.selectedId)
  const viewOriginal = useStore((s) => s.viewOriginal)
  const isolatedId = useStore((s) => s.isolatedId)
  const showClearance = useStore((s) => s.showClearance)
  const open = useStore((s) => s.rightOpen)
  const st = useStore.getState()
  const item = items.find((i) => i.id === selectedId)
  const clear = useMemo(() => (item ? clearances(item, items) : []), [item, items])

  if (!item) return null
  if (!open) {
    return (
      <button className="panel pointer-events-auto flex h-9 items-center gap-2 px-3 text-[12px] font-semibold text-stone-700" onClick={() => st.set({ rightOpen: true })}>
        {item.name}
      </button>
    )
  }
  const cat = CATALOG[item.type]
  const ro = viewOriginal || !!item.locked
  const upd = (patch: Parameters<typeof st.updateItem>[1]) => st.updateItem(item.id, patch)
  const conflict = findConflicts(item, items)
  const orig = originalById(item.id)
  const movedFromOriginal = !!orig && (Math.abs(orig.x - item.x) > 1e-4 || Math.abs(orig.z - item.z) > 1e-4 || Math.abs(normAngle(orig.rot - item.rot)) > 1e-4 || orig.w !== item.w || orig.d !== item.d || orig.h !== item.h || orig.finish !== item.finish || orig.color !== item.color)
  const finish = item.finish ?? cat.defaultFinish

  return (
    <aside className="panel thin-scroll pointer-events-auto max-h-full w-64 overflow-y-auto">
      <div className="flex items-start gap-2 px-3.5 pb-2.5 pt-3">
        <div className="min-w-0 flex-1">
          <input
            className="w-full truncate rounded bg-transparent text-[13.5px] font-bold text-stone-900 outline-none focus:bg-stone-900/5"
            value={item.name}
            disabled={viewOriginal}
            onChange={(e) => st.patchItem(item.id, { name: e.target.value })}
            onFocus={() => st.checkpoint()}
          />
          <div className="mt-0.5 text-[11px] text-stone-500">
            {cat.label}
            {cat.original && cat.confidence && orig && (
              <span className={`ml-1.5 rounded px-1 py-px text-[9.5px] font-bold uppercase ${cat.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : cat.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {cat.confidence} confidence
              </span>
            )}
          </div>
        </div>
        <button className="mt-0.5 text-stone-400 hover:text-stone-800" title="Collapse inspector" onClick={() => st.set({ rightOpen: false })}><PanelRightClose size={15} /></button>
      </div>

      {hasConflict(conflict) && (
        <div className="mx-3 mb-2 flex gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11.5px] font-medium text-red-700">
          <TriangleAlert size={14} className="mt-px shrink-0" />
          <span>Overlaps {describeConflict(item, items)}.</span>
        </div>
      )}
      {viewOriginal && <div className="mx-3 mb-2 rounded-lg bg-stone-900/5 px-2.5 py-2 text-[11.5px] text-stone-600">Original layout is read-only. Switch to “My layout” to edit.</div>}

      <Section title="Position">
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField label="X" suffix="cm" value={item.x * 100} disabled={ro} onCommit={(v) => upd({ x: v / 100 })} />
          <NumberField label="Z" suffix="cm" value={item.z * 100} disabled={ro} onCommit={(v) => upd({ z: v / 100 })} />
          <NumberField label="⟳" suffix="°" value={deg(item.rot)} step={5} disabled={ro} onCommit={(v) => upd({ rot: normAngle(rad(v)) })} />
          <NumberField label="↥" suffix="cm" value={item.y * 100} min={0} max={250} disabled={ro} onCommit={(v) => upd({ y: v / 100 })} />
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          <SmallButton title="Rotate −90°" disabled={ro} onClick={() => st.rotateSelected(-Math.PI / 2)}><RotateCw size={12} />90</SmallButton>
          <SmallButton title="Rotate −15° (Shift+R)" disabled={ro} onClick={() => st.rotateSelected(-Math.PI / 12)}><RotateCw size={12} />15</SmallButton>
          <SmallButton title="Rotate +15° (R)" disabled={ro} onClick={() => st.rotateSelected(Math.PI / 12)}><RotateCcw size={12} />15</SmallButton>
          <SmallButton title="Rotate +90°" disabled={ro} onClick={() => st.rotateSelected(Math.PI / 2)}><RotateCcw size={12} />90</SmallButton>
        </div>
      </Section>

      <Section title="Size">
        <div className="grid grid-cols-3 gap-1.5">
          <NumberField label="W" value={item.w * 100} min={2} max={400} disabled={ro} onCommit={(v) => upd({ w: v / 100 })} />
          <NumberField label="D" value={item.d * 100} min={1} max={400} disabled={ro} onCommit={(v) => upd({ d: v / 100 })} />
          <NumberField label="H" value={item.h * 100} min={0.2} max={260} disabled={ro} onCommit={(v) => upd({ h: v / 100 })} />
        </div>
        <p className="mt-1.5 text-[10.5px] text-stone-400">Width × depth × height in cm</p>
      </Section>

      <Section title="Material">
        <div className="flex flex-wrap gap-1.5">
          {cat.finishes.map((f) => (
            <button
              key={f}
              title={FINISH_LABELS[f] ?? f}
              disabled={viewOriginal}
              onClick={() => upd({ finish: f, color: undefined })}
              className={`h-6 w-6 rounded-full border-2 ${finish === f && !item.color ? 'border-blue-600 ring-2 ring-blue-200' : 'border-white ring-1 ring-black/15'}`}
              style={{ background: FINISH_SWATCH[f] ?? '#ccc' }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-stone-600">
          <span className="flex-1">{FINISH_LABELS[finish] ?? finish}{item.color ? ' · tinted' : ''}</span>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-900/10 px-1.5 py-1" title="Custom colour tint">
            <input type="color" disabled={viewOriginal} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" value={item.color ?? FINISH_SWATCH[finish] ?? '#888888'} onFocus={() => st.checkpoint()} onChange={(e) => st.patchItem(item.id, { color: e.target.value })} />
            Tint
          </label>
          {item.color && <button className="text-blue-600 hover:underline" onClick={() => upd({ color: undefined })}>clear</button>}
        </div>
      </Section>

      <Section
        title="Clearance"
        right={
          <label className="flex cursor-pointer items-center gap-1 text-[10.5px] text-stone-500">
            <input type="checkbox" checked={showClearance} onChange={(e) => st.set({ showClearance: e.target.checked })} /> show in view
          </label>
        }
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]">
          {clear.map((c) => (
            <div key={c.side} className="flex justify-between gap-1" title={`to ${c.hit}`}>
              <span className="text-stone-500">{SIDE_LABEL[c.side]}</span>
              <span className={`font-semibold tabular-nums ${c.dist < 0.6 && c.dist > 0.03 ? 'text-amber-700' : 'text-stone-800'}`}>{cm(c.dist)}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[10.5px] leading-snug text-stone-400">Free distance to the nearest wall or furniture. Amber = under 60 cm (tight to walk through).</p>
      </Section>

      <Section title="Actions">
        <div className="grid grid-cols-2 gap-1.5">
          <SmallButton disabled={viewOriginal} onClick={() => st.duplicate(item.id)} title="Ctrl+D"><Copy size={12} />Duplicate</SmallButton>
          <SmallButton disabled={viewOriginal} onClick={() => upd({ hidden: !item.hidden })} title="H">{item.hidden ? <Eye size={12} /> : <EyeOff size={12} />}{item.hidden ? 'Show' : 'Hide'}</SmallButton>
          <SmallButton onClick={() => st.set({ isolatedId: isolatedId === item.id ? null : item.id })} title="Show only this object"><Focus size={12} />{isolatedId === item.id ? 'Show all' : 'Isolate'}</SmallButton>
          <SmallButton disabled={viewOriginal} onClick={() => upd({ locked: !item.locked })} title="Locked objects cannot be moved">{item.locked ? <LockOpen size={12} /> : <Lock size={12} />}{item.locked ? 'Unlock' : 'Lock'}</SmallButton>
          <SmallButton disabled={viewOriginal || !orig || !movedFromOriginal} onClick={() => st.restoreItem(item.id)} title="Back to the photographed position, size and material"><Undo size={12} />Restore</SmallButton>
          <SmallButton danger disabled={viewOriginal} onClick={() => st.remove(item.id)} title="Delete"><Trash2 size={12} />Delete</SmallButton>
        </div>
      </Section>

      {cat.original && orig && (cat.source || cat.notes) && (
        <Section title="Reconstruction notes">
          {cat.source && <p className="text-[11px] leading-snug text-stone-600"><b className="font-semibold">Source:</b> {cat.source}</p>}
          {cat.notes && <p className="mt-1 text-[11px] leading-snug text-stone-500">{cat.notes}</p>}
        </Section>
      )}
    </aside>
  )
}

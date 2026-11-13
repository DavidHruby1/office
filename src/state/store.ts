import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATALOG } from '../data/catalog'
import { LAYOUT_VERSION, ORIGINAL_LAYOUT, originalById } from '../data/originalLayout'
import type { CameraPose } from '../data/referenceViews'
import type { FurnitureType, Item, LayoutFile } from '../data/types'
import type { Vec2 } from '../data/room'
import { findConflicts, hasConflict, normAngle, snapToWalls } from '../lib/geometry'

export type ViewMode = '3d' | '2d' | 'split'
export type CameraMode = 'orbit' | 'walk'
export type Tool = 'select' | 'measure'
export type Lighting = 'evening' | 'day'

const clone = (items: Item[]): Item[] => items.map((i) => ({ ...i }))

/** Fingerprint of the reconstructed original layout: saved edits made against an older reconstruction are discarded. */
const LAYOUT_HASH = (() => {
  const s = JSON.stringify(ORIGINAL_LAYOUT)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return `${LAYOUT_VERSION}:${h}`
})()
const HISTORY_LIMIT = 100

export interface Measurement { a: Vec2; b: Vec2 }

interface State {
  items: Item[]
  past: Item[][]
  future: Item[][]
  selectedId: string | null
  isolatedId: string | null
  viewOriginal: boolean

  viewMode: ViewMode
  cameraMode: CameraMode
  tool: Tool
  lighting: Lighting
  gridSnap: boolean
  wallSnap: boolean
  blockInvalid: boolean
  showClearance: boolean
  showGrid: boolean
  leftOpen: boolean
  rightOpen: boolean

  dragging: boolean
  measurePending: Vec2 | null
  measurements: Measurement[]
  cameraCmd: { pose: CameraPose; nonce: number } | null
  screenshotNonce: number
  toast: { text: string; nonce: number } | null
  layoutHash: string

  set: (patch: Partial<State>) => void
  select: (id: string | null) => void
  checkpoint: () => void
  /** live update without history entry – call checkpoint() once before a gesture */
  patchItem: (id: string, patch: Partial<Item>) => void
  /** update with a history entry */
  updateItem: (id: string, patch: Partial<Item>) => void
  undo: () => void
  redo: () => void
  addItem: (type: FurnitureType) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  restoreItem: (id: string) => void
  resetLayout: () => void
  rotateSelected: (delta: number) => void
  nudgeSelected: (dx: number, dz: number) => void
  importLayout: (file: unknown) => boolean
  exportLayout: () => LayoutFile
  addMeasurePoint: (p: Vec2) => void
  clearMeasurements: () => void
  flyTo: (pose: CameraPose) => void
  notify: (text: string) => void
}

let nonce = 1
const uid = (type: string) => `${type}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`

function validItem(v: any): v is Item {
  return v && typeof v === 'object' &&
    typeof v.id === 'string' && v.id.length > 0 && v.id.length <= 128 &&
    typeof v.type === 'string' && Object.hasOwn(CATALOG, v.type) &&
    typeof v.name === 'string' && v.name.length <= 200 &&
    ['x', 'z', 'rot', 'y'].every((k) => typeof v[k] === 'number' && Number.isFinite(v[k]) && Math.abs(v[k]) <= 1000) &&
    ['w', 'd', 'h'].every((k) => typeof v[k] === 'number' && Number.isFinite(v[k]) && v[k] >= 0.001 && v[k] <= 100) &&
    (v.finish === undefined || (typeof v.finish === 'string' && /^[a-zA-Z0-9]{1,64}$/.test(v.finish))) &&
    (v.color === undefined || (typeof v.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.color))) &&
    ['hidden', 'locked'].every((k) => v[k] === undefined || typeof v[k] === 'boolean')
}

function validItems(items: unknown): items is Item[] {
  return Array.isArray(items) && items.length <= 200 && items.every(validItem) &&
    new Set(items.map((i) => i.id)).size === items.length
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      items: clone(ORIGINAL_LAYOUT),
      past: [],
      future: [],
      selectedId: null,
      isolatedId: null,
      viewOriginal: false,

      viewMode: '3d',
      cameraMode: 'orbit',
      tool: 'select',
      lighting: 'evening',
      gridSnap: false,
      wallSnap: true,
      blockInvalid: true,
      showClearance: true,
      showGrid: true,
      leftOpen: true,
      rightOpen: true,

      dragging: false,
      measurePending: null,
      measurements: [],
      cameraCmd: null,
      screenshotNonce: 0,
      toast: null,
      layoutHash: LAYOUT_HASH,

      set: (patch) => set(patch),
      select: (id) => set({ selectedId: id }),
      notify: (text) => set({ toast: { text, nonce: nonce++ } }),

      checkpoint: () =>
        set((s) => ({ past: [...s.past.slice(-HISTORY_LIMIT + 1), clone(s.items)], future: [] })),

      patchItem: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      updateItem: (id, patch) => {
        if (get().viewOriginal) return
        get().checkpoint()
        get().patchItem(id, patch)
      },

      undo: () =>
        set((s) => {
          if (!s.past.length || s.viewOriginal) return s
          const prev = s.past[s.past.length - 1]
          return { past: s.past.slice(0, -1), future: [clone(s.items), ...s.future], items: prev }
        }),

      redo: () =>
        set((s) => {
          if (!s.future.length || s.viewOriginal) return s
          const [next, ...rest] = s.future
          return { past: [...s.past, clone(s.items)], future: rest, items: next }
        }),

      addItem: (type) => {
        const s = get()
        if (s.viewOriginal) return
        const c = CATALOG[type]
        const base: Item = {
          id: uid(type), type, name: c.label, x: 3.2, z: 1.25, rot: 0, w: c.w, d: c.d, h: c.h, y: c.y ?? 0,
        }
        // look for a free spot near the middle of the room
        let placed = base
        search: for (let r = 0; r < 12; r++) {
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2
            const cand = { ...base, x: 3.2 + Math.cos(a) * r * 0.3, z: 1.25 + Math.sin(a) * r * 0.12 }
            const p = snapToWalls(cand, 0, 0.02)
            const c2 = { ...cand, ...p }
            if (!hasConflict(findConflicts(c2, s.items))) { placed = c2; break search }
          }
        }
        s.checkpoint()
        set((st) => ({ items: [...st.items, placed], selectedId: placed.id }))
      },

      duplicate: (id) => {
        const s = get()
        const src = s.items.find((i) => i.id === id)
        if (!src || s.viewOriginal) return
        const copy: Item = { ...src, id: uid(src.type), name: `${src.name} copy`, locked: false }
        const tries = [[0.3, 0.3], [src.w + 0.05, 0], [-src.w - 0.05, 0], [0, src.d + 0.05], [0, -src.d - 0.05], [0.6, 0.6]]
        for (const [dx, dz] of tries) {
          const cand = { ...copy, x: src.x + dx, z: src.z + dz }
          const p = snapToWalls(cand, 0, 0.02)
          Object.assign(copy, p)
          if (!hasConflict(findConflicts(copy, s.items))) break
        }
        s.checkpoint()
        set((st) => ({ items: [...st.items, copy], selectedId: copy.id }))
      },

      remove: (id) => {
        const s = get()
        if (s.viewOriginal || !s.items.some((i) => i.id === id)) return
        s.checkpoint()
        set((st) => ({
          items: st.items.filter((i) => i.id !== id),
          selectedId: st.selectedId === id ? null : st.selectedId,
          isolatedId: st.isolatedId === id ? null : st.isolatedId,
        }))
      },

      restoreItem: (id) => {
        const o = originalById(id)
        if (!o) return
        get().updateItem(id, { ...o })
      },

      resetLayout: () => {
        get().checkpoint()
        set({ items: clone(ORIGINAL_LAYOUT), selectedId: null, isolatedId: null })
      },

      rotateSelected: (delta) => {
        const s = get()
        const it = s.items.find((i) => i.id === s.selectedId)
        if (!it || it.locked || s.viewOriginal) return
        s.updateItem(it.id, { rot: normAngle(it.rot + delta) })
      },

      nudgeSelected: (dx, dz) => {
        const s = get()
        const it = s.items.find((i) => i.id === s.selectedId)
        if (!it || it.locked || s.viewOriginal) return
        const p = snapToWalls({ ...it, x: it.x + dx, z: it.z + dz }, 0, 0)
        s.updateItem(it.id, p)
      },

      importLayout: (file) => {
        const f = file as LayoutFile
        if (!f || f.app !== 'room-twin' || f.version !== LAYOUT_VERSION || !validItems(f.items)) return false
        get().checkpoint()
        set({ items: clone(f.items), selectedId: null, isolatedId: null, viewOriginal: false })
        return true
      },

      exportLayout: () => ({
        app: 'room-twin', version: LAYOUT_VERSION, savedAt: new Date().toISOString(), items: clone(get().items),
      }),

      addMeasurePoint: (p) =>
        set((s) =>
          s.measurePending
            ? { measurements: [...s.measurements, { a: s.measurePending, b: p }], measurePending: null }
            : { measurePending: p },
        ),
      clearMeasurements: () => set({ measurements: [], measurePending: null }),

      flyTo: (pose) => set({ cameraCmd: { pose, nonce: nonce++ } }),
    }),
    {
      name: 'room-twin-layout',
      version: LAYOUT_VERSION,
      migrate: () => ({}) as any, // layout definition changed → start again from the reconstructed original
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>
        return {
          ...current,
          ...(p.layoutHash === LAYOUT_HASH && validItems(p.items) ? { items: clone(p.items) } : {}),
          ...(['3d', '2d', 'split'].includes(p.viewMode ?? '') ? { viewMode: p.viewMode } : {}),
          ...(['day', 'evening'].includes(p.lighting ?? '') ? { lighting: p.lighting } : {}),
          ...Object.fromEntries(['gridSnap', 'wallSnap', 'blockInvalid', 'showClearance', 'showGrid']
            .filter((k) => typeof (p as any)[k] === 'boolean').map((k) => [k, (p as any)[k]])),
          layoutHash: LAYOUT_HASH,
        }
      },
      partialize: (s) => ({
        layoutHash: s.layoutHash,
        items: s.items, viewMode: s.viewMode, lighting: s.lighting, gridSnap: s.gridSnap, wallSnap: s.wallSnap,
        blockInvalid: s.blockInvalid, showClearance: s.showClearance, showGrid: s.showGrid,
      }),
    },
  ),
)

/** Items currently shown (original reference layout or the user's edited layout). */
export const useItems = () => useStore((s) => (s.viewOriginal ? ORIGINAL_LAYOUT : s.items))
export const getShownItems = () => {
  const s = useStore.getState()
  return s.viewOriginal ? ORIGINAL_LAYOUT : s.items
}
export const isEditable = (it: Item | undefined) => !!it && !it.locked && !useStore.getState().viewOriginal

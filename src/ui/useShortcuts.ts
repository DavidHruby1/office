import { useEffect } from 'react'
import { DEFAULT_VIEW, ISO_VIEW, TOP_VIEW } from '../data/referenceViews'
import { useStore } from '../state/store'
import { exportJson } from './Toolbar'

export function useShortcuts(toggleHelp: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const s = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const walking = s.cameraMode === 'walk'
      const done = () => e.preventDefault()

      if (mod && key === 'z') { e.shiftKey ? s.redo() : s.undo(); return done() }
      if (mod && key === 'y') { s.redo(); return done() }
      if (mod && key === 's') { exportJson(); return done() }
      if (mod && key === 'd') { if (s.selectedId) s.duplicate(s.selectedId); return done() }
      if (mod || walking) return // WASD etc. belong to the walkthrough

      const fly = (pose: typeof DEFAULT_VIEW) => { if (s.viewMode === '2d') s.set({ viewMode: '3d' }); s.flyTo(pose) }
      switch (key) {
        case 'escape':
          if (s.measurePending) s.set({ measurePending: null })
          else if (s.tool === 'measure') s.set({ tool: 'select' })
          else s.select(null)
          return
        case 'delete': case 'backspace': if (s.selectedId) { s.remove(s.selectedId); done() } return
        case 'r': s.rotateSelected(((e.shiftKey ? -15 : 15) * Math.PI) / 180); return
        case 'h': { const it = s.items.find((i) => i.id === s.selectedId); if (it) s.updateItem(it.id, { hidden: !it.hidden }); return }
        case 'arrowleft': s.nudgeSelected(e.shiftKey ? -0.1 : -0.01, 0); return done()
        case 'arrowright': s.nudgeSelected(e.shiftKey ? 0.1 : 0.01, 0); return done()
        case 'arrowup': s.nudgeSelected(0, e.shiftKey ? -0.1 : -0.01); return done()
        case 'arrowdown': s.nudgeSelected(0, e.shiftKey ? 0.1 : 0.01); return done()
        case '1': s.set({ viewMode: '3d' }); return
        case '2': s.set({ viewMode: '2d' }); return
        case '3': s.set({ viewMode: 'split' }); return
        case 't': fly(TOP_VIEW); return
        case 'i': fly(ISO_VIEW); return
        case 'home': fly(DEFAULT_VIEW); return
        case 'f': if (s.viewMode !== '2d') s.set({ cameraMode: 'walk', tool: 'select' }); return
        case 'v': s.set({ tool: 'select' }); return
        case 'm': s.set({ tool: s.tool === 'measure' ? 'select' : 'measure' }); return
        case 'g': s.set({ gridSnap: !s.gridSnap }); return
        case 'w': s.set({ wallSnap: !s.wallSnap }); return
        case 'o': s.set({ viewOriginal: !s.viewOriginal }); return
        case 'l': s.set({ lighting: s.lighting === 'evening' ? 'day' : 'evening' }); return
        case 'p': if (s.viewMode !== '2d') s.set({ screenshotNonce: s.screenshotNonce + 1 }); return
        case '?': toggleHelp(); return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleHelp])
}

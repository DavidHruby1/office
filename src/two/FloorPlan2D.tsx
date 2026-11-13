import type Konva from 'konva'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Arc, Circle, Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import { CATALOG } from '../data/catalog'
import { FLOOR_POLY, ROOM, WALL_FRAMES, facing } from '../data/room'
import type { Item } from '../data/types'
import { allConflicts, clearances, cm, deg, dist2, findConflicts, hasConflict, normAngle, resolveMove } from '../lib/geometry'
import { GRID, settleMove, warnIfConflict } from '../state/editing'
import { useItems, useStore } from '../state/store'

const ACCENT = '#2563eb'
const BAD = '#dc2626'
const PAD = 0.9 // metres of margin around the room when fitting

interface View { s: number; ox: number; oy: number }

/** Fit the room into the part of the container that is not covered by the floating panels. */
function fit(w: number, h: number, padL = 0, padR = 0): View {
  const top = 56, bottom = 50
  const fw = Math.max(200, w - padL - padR)
  const fh = Math.max(150, h - top - bottom)
  const s = Math.min(fw / (ROOM.length + PAD * 2), fh / (ROOM.widthKitchenEnd + PAD * 2))
  return { s, ox: padL + (fw - ROOM.length * s) / 2, oy: top + (fh - ROOM.widthKitchenEnd * s) / 2 }
}

/** px-sized label that stays readable at every zoom level */
function Tag({ x, y, text, color, s, bg = true }: { x: number; y: number; text: string; color: string; s: number; bg?: boolean }) {
  const fs = 11 / s
  const w = (text.length * 6.4 + 10) / s
  const h = 17 / s
  return (
    <Group x={x} y={y} listening={false}>
      {bg && <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} cornerRadius={4 / s} />}
      <Text x={-w / 2} y={-h / 2} width={w} height={h} text={text} fontSize={fs} fontStyle="600" fill={bg ? '#fff' : color} align="center" verticalAlign="middle" />
    </Group>
  )
}

function PlanItem({ item, selected, bad, s, dim }: { item: Item; selected: boolean; bad: boolean; s: number; dim: boolean }) {
  const lastValid = useRef({ x: item.x, z: item.z })
  const cat = CATALOG[item.type]
  const editable = !item.locked && !useStore((st) => st.viewOriginal)
  const tool = useStore((st) => st.tool)
  const stroke = bad ? BAD : selected ? ACCENT : 'rgba(28,25,23,.55)'
  const upright = item.y > 0.3 // wall-mounted / stacked things are drawn as dashed outlines
  const label = Math.min(item.w, item.d) > 0.28 || Math.max(item.w, item.d) > 0.5
  const fs = Math.min(11 / s, Math.max(item.w, item.d) / 6.5)
  const textRot = deg(item.rot)
  const tw = Math.max(item.w, item.d) * 1.1

  return (
    <Group
      x={item.x}
      y={item.z}
      rotation={-deg(item.rot)}
      opacity={dim ? 0.18 : 1}
      draggable={editable && tool === 'select'}
      onMouseDown={(e) => {
        if (tool !== 'select') return
        e.cancelBubble = true
        useStore.getState().select(item.id)
      }}
      onTap={() => useStore.getState().select(item.id)}
      onDragStart={() => {
        lastValid.current = { x: item.x, z: item.z }
        useStore.getState().checkpoint()
        useStore.getState().set({ dragging: true })
      }}
      onDragMove={(e) => {
        const st = useStore.getState()
        const cur = st.items.find((i) => i.id === item.id)
        if (!cur) return
        const alt = e.evt.altKey
        const p = resolveMove(cur, e.target.x(), e.target.y(), { gridSnap: st.gridSnap && !alt, wallSnap: st.wallSnap && !alt, grid: GRID })
        e.target.position({ x: p.x, y: p.z })
        if (!hasConflict(findConflicts({ ...cur, ...p }, st.items))) lastValid.current = p
        st.patchItem(item.id, p)
      }}
      onDragEnd={(e) => {
        useStore.getState().set({ dragging: false })
        settleMove(item.id, lastValid.current)
        const cur = useStore.getState().items.find((i) => i.id === item.id)
        if (cur) e.target.position({ x: cur.x, y: cur.z })
      }}
      onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c && tool === 'select') c.style.cursor = editable ? 'grab' : 'pointer' }}
      onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = '' }}
    >
      <Rect
        x={-item.w / 2}
        y={-item.d / 2}
        width={item.w}
        height={item.d}
        fill={item.color ?? cat.plan}
        opacity={upright ? 0.45 : 0.92}
        stroke={stroke}
        strokeWidth={(selected || bad ? 2.2 : 1) / s}
        dash={upright ? [5 / s, 3 / s] : undefined}
        cornerRadius={Math.min(0.02, item.w / 4, item.d / 4)}
        shadowColor="#000"
        shadowBlur={selected ? 10 : 0}
        shadowOpacity={0.25}
      />
      {/* front edge marker */}
      {Math.min(item.w, item.d) > 0.1 && (
        <Line points={[-item.w / 2 + 0.03, item.d / 2 - 0.025, item.w / 2 - 0.03, item.d / 2 - 0.025]} stroke="rgba(255,255,255,.75)" strokeWidth={2 / s} listening={false} />
      )}
      {label && (
        <Text
          text={item.name}
          rotation={textRot}
          x={0}
          y={0}
          offsetX={tw / 2}
          offsetY={fs * 0.6}
          width={tw}
          align="center"
          fontSize={fs}
          fontStyle="600"
          fill="#fff"
          shadowColor="#000"
          shadowBlur={3}
          shadowOpacity={0.9}
          listening={false}
          wrap="none"
          ellipsis
        />
      )}
    </Group>
  )
}

/** Top-down editor. Reads and writes exactly the same item data as the 3D view. */
export function FloorPlan2D() {
  const box = useRef<HTMLDivElement>(null)
  const layer = useRef<Konva.Layer>(null)
  const [size, setSize] = useState({ w: 800, h: 500 })
  const [view, setView] = useState<View>(() => fit(800, 500))
  const userView = useRef(false)

  const items = useItems()
  const selectedId = useStore((s) => s.selectedId)
  const isolatedId = useStore((s) => s.isolatedId)
  const tool = useStore((s) => s.tool)
  const showGrid = useStore((s) => s.showGrid)
  const showClearance = useStore((s) => s.showClearance)
  const measurements = useStore((s) => s.measurements)
  const pending = useStore((s) => s.measurePending)
  const viewOriginal = useStore((s) => s.viewOriginal)
  const [cursor, setCursor] = useState<{ x: number; z: number } | null>(null)
  // floating panels that cover this view: object list (only in pure 2D mode) and the inspector
  const padL = useStore((s) => (s.viewMode === '2d' && s.leftOpen ? 236 : 0))
  const padR = useStore((s) => (s.selectedId && s.rightOpen ? 268 : 0))
  const pads = useRef({ padL, padR })
  pads.current = { padL, padR }
  useEffect(() => {
    if (!userView.current) setView(fit(size.w, size.h, padL, padR))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padL, padR])

  useEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight
      setSize({ w, h })
      if (!userView.current) setView(fit(w, h, pads.current.padL, pads.current.padR))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { s } = view
  const visible = items.filter((i) => !i.hidden)
  const ordered = useMemo(() => [...visible].sort((a, b) => a.y + a.h - (b.y + b.h)), [visible])
  const conflicts = useMemo(() => allConflicts(items), [items])
  const sel = visible.find((i) => i.id === selectedId)
  const clear = useMemo(() => (sel && showClearance ? clearances(sel, items) : []), [sel, items, showClearance])

  const world = () => {
    const p = layer.current?.getRelativePointerPosition()
    return p ? { x: p.x, z: p.y } : null
  }

  const startRotate = (item: Item) => {
    let started = false
    const move = (ev: MouseEvent) => {
      const p = world()
      if (!p) return
      if (!started) { started = true; useStore.getState().checkpoint() }
      let a = facing(p.x - item.x, p.z - item.z)
      const step = ((ev.shiftKey ? 45 : 5) * Math.PI) / 180
      if (!ev.altKey) a = Math.round(a / step) * step
      useStore.getState().patchItem(item.id, { rot: normAngle(a) })
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      if (started) warnIfConflict(item.id)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const gridLines = useMemo(() => {
    const out: { pts: number[]; major: boolean }[] = []
    const x0 = -1, x1 = ROOM.length + 1, z0 = -1, z1 = ROOM.widthKitchenEnd + 1
    const step = s > 150 ? 0.1 : 0.5
    for (let x = x0; x <= x1 + 1e-6; x += step) out.push({ pts: [x, z0, x, z1], major: Math.abs(x - Math.round(x)) < 1e-6 })
    for (let z = z0; z <= z1 + 1e-6; z += step) out.push({ pts: [z0 - 0 + x0 - z0, z, x1, z], major: Math.abs(z - Math.round(z)) < 1e-6 })
    return out
  }, [s])

  const knob = sel && !sel.locked && !viewOriginal
    ? { x: sel.x + Math.sin(sel.rot) * (sel.d / 2 + 22 / s), z: sel.z + Math.cos(sel.rot) * (sel.d / 2 + 22 / s), ex: sel.x + Math.sin(sel.rot) * (sel.d / 2), ez: sel.z + Math.cos(sel.rot) * (sel.d / 2) }
    : null

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden" style={{ background: '#e9e6e0', cursor: tool === 'measure' ? 'crosshair' : undefined }}>
      <Stage
        width={size.w}
        height={size.h}
        onWheel={(e) => {
          e.evt.preventDefault()
          const st = e.target.getStage()!
          const p = st.getPointerPosition()!
          const k = Math.exp(-e.evt.deltaY * 0.0012)
          const ns = Math.min(600, Math.max(40, view.s * k))
          userView.current = true
          setView({ s: ns, ox: p.x - ((p.x - view.ox) / view.s) * ns, oy: p.y - ((p.y - view.oy) / view.s) * ns })
        }}
        onMouseMove={() => setCursor(world())}
        onMouseLeave={() => setCursor(null)}
        onMouseDown={(e) => {
          const st = useStore.getState()
          if (st.tool === 'measure') {
            const p = world()
            if (p) st.addMeasurePoint(p)
            return
          }
          if (e.target === e.target.getStage() || e.target.name() === 'bg') st.select(null)
        }}
      >
        <Layer
          ref={layer}
          x={view.ox}
          y={view.oy}
          scaleX={s}
          scaleY={s}
          draggable={tool === 'select'}
          onDragStart={(e) => { if ((e.target as unknown) === layer.current) userView.current = true }}
          onDragEnd={(e) => { if ((e.target as unknown) === layer.current) setView((v) => ({ ...v, ox: e.target.x(), oy: e.target.y() })) }}
        >
          <Rect name="bg" x={-50} y={-50} width={110} height={110} fill="#e9e6e0" />
          {showGrid && gridLines.map((g, i) => (
            <Line key={i} points={g.pts} stroke={g.major ? 'rgba(0,0,0,.13)' : 'rgba(0,0,0,.055)'} strokeWidth={1 / s} listening={false} />
          ))}
          {/* floor */}
          <Line name="bg" points={FLOOR_POLY.flatMap((p) => [p.x, p.z])} closed fill="#f6efe2" />
          {/* walls drawn outside the floor polygon, openings on top */}
          {WALL_FRAMES.map((f) => {
            const t = 0.14
            const a = f.wall.a, b = f.wall.b
            const ext = t // extend so the corners close
            const ax = a.x - f.dir.x * ext - f.n.x * (t / 2), az = a.z - f.dir.z * ext - f.n.z * (t / 2)
            const bx = b.x + f.dir.x * ext - f.n.x * (t / 2), bz = b.z + f.dir.z * ext - f.n.z * (t / 2)
            return (
              <Group key={f.wall.id} listening={false}>
                <Line points={[ax, az, bx, bz]} stroke="#3f3a36" strokeWidth={t} />
                {f.wall.openings.map((o, i) => {
                  const p0 = { x: a.x + f.dir.x * o.t0 - f.n.x * (t / 2), z: a.z + f.dir.z * o.t0 - f.n.z * (t / 2) }
                  const p1 = { x: a.x + f.dir.x * o.t1 - f.n.x * (t / 2), z: a.z + f.dir.z * o.t1 - f.n.z * (t / 2) }
                  if (o.kind === 'window') {
                    return (
                      <Group key={i}>
                        <Line points={[p0.x, p0.z, p1.x, p1.z]} stroke="#f6efe2" strokeWidth={t} />
                        <Line points={[p0.x, p0.z, p1.x, p1.z]} stroke="#5aa2d8" strokeWidth={t * 0.35} />
                      </Group>
                    )
                  }
                  // door: gap + swing arc (hinged at t0, opening into the room)
                  const w = o.t1 - o.t0
                  const hx = a.x + f.dir.x * o.t0, hz = a.z + f.dir.z * o.t0
                  const closedAng = deg(Math.atan2(f.dir.z, f.dir.x))
                  const openAng = deg(Math.atan2(f.n.z, f.n.x))
                  let sweep = openAng - closedAng
                  if (sweep > 180) sweep -= 360
                  if (sweep < -180) sweep += 360
                  const leaf = ((closedAng + sweep * (82 / 90)) * Math.PI) / 180
                  return (
                    <Group key={i}>
                      <Line points={[p0.x, p0.z, p1.x, p1.z]} stroke="#f6efe2" strokeWidth={t} />
                      <Arc x={hx} y={hz} innerRadius={w} outerRadius={w} angle={Math.abs(sweep)} rotation={sweep < 0 ? closedAng + sweep : closedAng} stroke="rgba(0,0,0,.35)" strokeWidth={1 / s} dash={[4 / s, 3 / s]} />
                      <Line points={[hx, hz, hx + Math.cos(leaf) * w, hz + Math.sin(leaf) * w]} stroke="#57534e" strokeWidth={0.04} />
                    </Group>
                  )
                })}
                <Tag
                  x={(a.x + b.x) / 2 - f.n.x * (t + 20 / s)}
                  y={(a.z + b.z) / 2 - f.n.z * (t + 20 / s)}
                  text={`${Math.round(f.length * 100)} cm`}
                  color="#57534e"
                  s={s}
                  bg={false}
                />
              </Group>
            )
          })}

          {ordered.map((it) => (
            <PlanItem key={it.id} item={it} selected={it.id === selectedId} bad={!!conflicts[it.id]} s={s} dim={!!isolatedId && isolatedId !== it.id} />
          ))}

          {/* clearances of the selected item */}
          {clear.filter((c) => c.dist > 0.03).map((c) => (
            <Group key={c.side} listening={false}>
              <Line points={[c.from.x, c.from.z, c.to.x, c.to.z]} stroke="#d97706" strokeWidth={1.3 / s} dash={[5 / s, 4 / s]} />
              <Tag x={(c.from.x + c.to.x) / 2} y={(c.from.z + c.to.z) / 2} text={cm(c.dist)} color="#b45309" s={s} />
            </Group>
          ))}

          {/* rotation knob */}
          {knob && sel && (
            <Group>
              <Line points={[knob.ex, knob.ez, knob.x, knob.z]} stroke={ACCENT} strokeWidth={1.5 / s} listening={false} />
              <Circle
                x={knob.x}
                y={knob.z}
                radius={7 / s}
                fill="#fff"
                stroke={ACCENT}
                strokeWidth={2 / s}
                onMouseDown={(e) => { e.cancelBubble = true; startRotate(sel) }}
                onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'alias' }}
                onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = '' }}
              />
            </Group>
          )}
          {sel && (
            <Tag x={sel.x} y={sel.z - Math.hypot(sel.w, sel.d) / 2 - 14 / s} text={`${Math.round(sel.w * 100)} × ${Math.round(sel.d * 100)} cm`} color={conflicts[sel.id] ? BAD : ACCENT} s={s} />
          )}

          {/* measurements */}
          {measurements.map((m, i) => (
            <Group key={i} listening={false}>
              <Line points={[m.a.x, m.a.z, m.b.x, m.b.z]} stroke="#059669" strokeWidth={2 / s} />
              <Circle x={m.a.x} y={m.a.z} radius={3.5 / s} fill="#059669" />
              <Circle x={m.b.x} y={m.b.z} radius={3.5 / s} fill="#059669" />
              <Tag x={(m.a.x + m.b.x) / 2} y={(m.a.z + m.b.z) / 2} text={cm(dist2(m.a, m.b))} color="#047857" s={s} />
            </Group>
          ))}
          {pending && (
            <Group listening={false}>
              <Circle x={pending.x} y={pending.z} radius={4.5 / s} fill="#059669" />
              {cursor && tool === 'measure' && (
                <>
                  <Line points={[pending.x, pending.z, cursor.x, cursor.z]} stroke="#059669" strokeWidth={1.5 / s} dash={[5 / s, 4 / s]} />
                  <Tag x={(pending.x + cursor.x) / 2} y={(pending.z + cursor.z) / 2} text={cm(dist2(pending, cursor))} color="#047857" s={s} />
                </>
              )}
            </Group>
          )}
        </Layer>
      </Stage>
      <div className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-stone-600">
        {cursor ? `x ${Math.round(cursor.x * 100)} · z ${Math.round(cursor.z * 100)} cm` : 'scroll = zoom · drag background = pan'}
        {userView.current && (
          <button className="pointer-events-auto ml-2 text-blue-600 underline" onClick={() => { userView.current = false; setView(fit(size.w, size.h, padL, padR)) }}>fit</button>
        )}
      </div>
    </div>
  )
}

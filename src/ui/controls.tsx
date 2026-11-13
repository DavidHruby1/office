import { useEffect, useState, type ReactNode } from 'react'

export function IconButton({
  children, label, active, disabled, onClick, kbd, className = '',
}: { children: ReactNode; label: string; active?: boolean; disabled?: boolean; onClick?: () => void; kbd?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-medium transition-colors
        ${active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-900/8'}
        ${disabled ? 'cursor-not-allowed opacity-35 hover:bg-transparent' : ''} ${className}`}
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
        {label}
        {kbd && <span className="ml-1.5 rounded bg-white/15 px-1 font-mono text-[10px]">{kbd}</span>}
      </span>
    </button>
  )
}

export const Divider = () => <div className="mx-1 h-5 w-px shrink-0 bg-stone-900/12" />

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode; title: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-stone-900/7 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex h-7 items-center gap-1 rounded-md px-2.5 text-[12px] font-semibold transition-colors ${value === o.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Numeric field that commits on Enter / blur / arrow keys (one undo step per edit). */
export function NumberField({
  label, value, onCommit, step = 1, suffix, disabled, min, max,
}: { label: string; value: number; onCommit: (v: number) => void; step?: number; suffix?: string; disabled?: boolean; min?: number; max?: number }) {
  const shown = String(Math.round(value * 10) / 10)
  const [text, setText] = useState(shown)
  useEffect(() => setText(shown), [shown])
  const commit = (raw: string) => {
    let v = parseFloat(raw.replace(',', '.'))
    if (!isFinite(v)) { setText(shown); return }
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    if (Math.abs(v - value) > 1e-6) onCommit(v)
    else setText(shown)
  }
  return (
    <label className={`flex items-center gap-1.5 rounded-lg border border-stone-900/10 bg-white px-2 py-1 focus-within:border-blue-500 ${disabled ? 'opacity-50' : ''}`}>
      <span className="w-4 shrink-0 text-[10px] font-bold uppercase text-stone-400">{label}</span>
      <input
        className="w-full min-w-0 bg-transparent text-right text-[12.5px] font-medium tabular-nums text-stone-800 outline-none"
        value={text}
        disabled={disabled}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') { setText(shown); (e.target as HTMLInputElement).blur() }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const base = parseFloat(text.replace(',', '.'))
            const k = (e.shiftKey ? 10 : 1) * step * (e.key === 'ArrowUp' ? 1 : -1)
            commit(String((isFinite(base) ? base : value) + k))
          }
        }}
      />
      {suffix && <span className="shrink-0 text-[10px] text-stone-400">{suffix}</span>}
    </label>
  )
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-t border-stone-900/8 px-3.5 py-3 first:border-t-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

export function SmallButton({ children, onClick, disabled, danger, title }: { children: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7.5 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11.5px] font-semibold transition-colors
        ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-stone-900/10 text-stone-700 hover:bg-stone-900/5'}
        ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      {children}
    </button>
  )
}

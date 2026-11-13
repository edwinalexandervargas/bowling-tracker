import type { ReactNode } from 'react'

// Shared building blocks so screens look consistent.

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white/[0.04] ring-1 ring-white/10 ${className}`}>{children}</div>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</h2>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid rounded-xl bg-white/5 p-1 ring-1 ring-white/10"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.key} type="button" role="tab" aria-selected={o.key === value} onClick={() => onChange(o.key)}
          className={`rounded-lg py-1.5 text-sm font-medium transition ${
            o.key === value ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-gray-200'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chips<T extends string | null>({
  options, value, onChange, label,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button key={o.key ?? 'none'} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            o.key === value
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-white/5 text-gray-300 ring-1 ring-white/10'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Compact metric: label, big value, optional sub-line and progress bar (0–100).
export function Metric({ label, value, sub, bar }: { label: string; value: string | number | null; sub?: string; bar?: number | null }) {
  return (
    <Card className="p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? '—'}</p>
      {bar != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" style={{ width: `${Math.min(100, bar)}%` }} />
        </div>
      )}
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </Card>
  )
}

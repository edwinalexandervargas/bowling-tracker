import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

// Shared building blocks so screens look consistent.

// Every screen sits in a Page: one title style, one content width.
// `wide` screens (lists, scoresheets, dashboards) use the room on tablet and desktop;
// forms stay narrow so lines don't get long.
export function Page({ title, back, action, wide = false, children }: {
  title: string
  back?: { to: string; label: string }
  action?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={`mx-auto w-full space-y-5 ${wide ? 'max-w-5xl' : 'max-w-md'}`}>
      <header>
        {back && (
          <Link to={back.to} className="-ml-2 inline-flex min-h-tap items-center gap-1 px-2 text-sm font-medium text-accent">
            <Icon name="back" className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        <div className="flex items-center justify-between gap-3">
          <h1 className="display text-2xl">{title}</h1>
          {action}
        </div>
      </header>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface ring-1 ring-line ${className}`}>{children}</div>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-8 items-center justify-between px-1">
      <h2 className="text-sm font-semibold text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid rounded-xl bg-surface p-1 ring-1 ring-line"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.key} type="button" role="tab" aria-selected={o.key === value} onClick={() => onChange(o.key)}
          className={`min-h-tap rounded-lg text-sm font-medium transition ${
            o.key === value ? 'bg-ink text-page' : 'text-muted hover:text-ink'
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
  // py-1: a sideways-scrolling row clips what sticks out of it, and the pill
  // outlines are drawn 1px outside the pill, so they need that room.
  return (
    <div aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button key={o.key ?? 'none'} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)}
          className={`min-h-tap shrink-0 rounded-full px-4 text-sm font-medium transition ${
            o.key === value ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-1 ring-line'
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
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="num mt-1 text-3xl font-semibold">{value ?? '—'}</p>
      {bar != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, bar)}%` }} />
        </div>
      )}
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  )
}

// Six pins in a rack: the app's mark, used where a picture is wanted.
export function PinRack({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="19.5" r="2.4" /><circle cx="8.2" cy="13" r="2.4" /><circle cx="15.8" cy="13" r="2.4" />
      <circle cx="4.4" cy="6.5" r="2.4" /><circle cx="12" cy="6.5" r="2.4" /><circle cx="19.6" cy="6.5" r="2.4" />
    </svg>
  )
}

// The Kingpin logo: the ten-pin rack from above, with the 5 pin (the kingpin)
// in the accent color. Pins take the text color, so set it with text-*.
export function KingpinMark({ className = 'h-10 w-11', ring = false }: { className?: string; ring?: boolean }) {
  const pins: [number, number, number][] = [
    [17, 12, 0.35], [39, 12, 0.35], [61, 12, 0.35], [83, 12, 0.35],
    [28, 35, 0.6], [72, 35, 0.6],
    [39, 58, 0.8], [61, 58, 0.8],
    [50, 81, 1],
  ]
  return (
    <svg aria-hidden="true" viewBox="0 0 100 90" className={className}>
      {pins.map(([cx, cy, o]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7.5" fill="currentColor" opacity={o} />
      ))}
      {ring && <circle cx="50" cy="35" r="10.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" />}
      <circle cx="50" cy="35" r={ring ? 7.5 : 8.5} fill="var(--color-accent)" />
    </svg>
  )
}

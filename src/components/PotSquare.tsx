import type { SquareLook } from '../sidepots/looks'

// Each look differs in shape as well as colour: filled, outlined, dashed,
// double-ringed, or empty, with a different mark inside.
// Outlines are borders, not Tailwind rings: rings are drawn with box-shadow,
// and the glow needs box-shadow to itself.
const LOOK_CLASS: Record<SquareLook, string> = {
  won: 'bg-accent text-on-accent ring-2 ring-ink ring-offset-2 ring-offset-page',
  lit: 'bg-accent text-on-accent',
  dim: 'border border-line text-muted',
  miss: 'border border-danger bg-surface text-danger',
  closest: 'glow-strong border-2 border-accent bg-raised text-accent',
  target: 'glow border border-dashed border-accent/70 text-accent',
  idle: 'border border-line text-muted/50',
}

// What a screen reader says for each look.
const LOOK_WORDS: Record<SquareLook, string> = {
  won: 'hit, on the winning line',
  lit: 'hit',
  dim: 'hit, but no line through it can win',
  miss: 'missed',
  closest: 'not bowled yet, on the closest line',
  target: 'not bowled yet, still worth hitting',
  idle: 'nothing to chase',
}

// The mark in the middle. Hits show the frame's own mark (X or /).
function Mark({ look, mark }: { look: SquareLook; mark?: string }) {
  if (look === 'closest') return <span className="h-3 w-3 rounded-full bg-accent" />
  if (look === 'target') return <span className="h-3 w-3 rounded-full ring-1 ring-accent" />
  if (look === 'idle') return null
  return <span className="num text-2xl leading-none font-semibold">{look === 'miss' ? '–' : mark}</span>
}

// One square of a side-pot board. `label` says which frame it is.
export function PotSquare({ look, label, mark, className = '' }: {
  look: SquareLook
  label: string
  mark?: string
  className?: string
}) {
  const filled = look === 'won' || look === 'lit'
  return (
    <li className={`relative flex aspect-square flex-col items-center justify-center rounded-lg ${LOOK_CLASS[look]} ${className}`}>
      <span className="sr-only">{label}: {LOOK_WORDS[look]}</span>
      <span aria-hidden="true" className={`absolute top-1 text-[11px] leading-none ${filled ? 'text-on-accent/75' : 'text-muted'}`}>
        {label}
      </span>
      <span aria-hidden="true" className="mt-3 flex h-6 items-center">
        <Mark look={look} mark={mark} />
      </span>
    </li>
  )
}

// The key under a board: the same shapes, small, with words.
const LEGEND: { look: SquareLook; words: string }[] = [
  { look: 'lit', words: 'Hit' },
  { look: 'closest', words: 'Closest line' },
  { look: 'target', words: 'Still alive' },
  { look: 'miss', words: 'Missed' },
  { look: 'dim', words: 'Hit, line dead' },
]

export function PotLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {LEGEND.map(({ look, words }) => (
        <li key={look} className="flex items-center gap-1.5">
          {/* shadow-none and animate-none: the key shows the shape only, without the glow */}
          <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded shadow-none! animate-none! ${LOOK_CLASS[look]}`} />
          {words}
        </li>
      ))}
    </ul>
  )
}

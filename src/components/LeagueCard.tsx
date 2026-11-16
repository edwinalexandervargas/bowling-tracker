import { useId } from 'react'
import { Link } from 'react-router'
import type { LeagueSlice, PatternSlice } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { count } from '../format'
import { Card } from './ui'
import { Icon } from './Icon'
import { textButton } from './styles'

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num text-xl font-semibold">{value ?? '—'}</dd>
    </div>
  )
}

// A league on the Overview. The header is a button: tapping it drops the card
// open to show that league's numbers, and tapping again closes it.
export function LeagueCard({ league, patternRows, open, onToggle }: {
  league: LeagueSlice
  patternRows?: PatternSlice[]   // only for leagues bowled on sport patterns
  open: boolean
  onToggle: () => void
}) {
  const panelId = useId()
  const { score, shots } = league

  return (
    <Card className="overflow-hidden">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-raised ${open ? 'bg-raised' : ''}`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-raised text-sm font-semibold text-accent ring-1 ring-line">
            {league.label.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{league.label}</span>
            <span className="block text-xs text-muted">{count(score.games, 'game')}</span>
          </span>
          <span className="text-right">
            <span className="num block text-3xl font-semibold">{score.average ?? '—'}</span>
            <span className="block text-xs text-muted">average</span>
          </span>
          {/* The arrow points down when closed and flips up when open */}
          <Icon name="back" className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </h3>

      {/* Animating grid rows from 0fr to 1fr slides the panel open to whatever
          height its content needs, with no measuring in JavaScript. */}
      <div
        id={panelId}
        role="region"
        aria-label={`${league.label} stats`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        {/* inert: while closed, nothing inside can be tabbed to or read out */}
        <div className="overflow-hidden" inert={!open}>
          <div className="space-y-4 border-t border-line p-4">
            <dl className="grid grid-cols-3 gap-x-3 gap-y-4">
              <Stat label="Strike" value={fmtPct(pct(shots.strikes, shots.strikeChances))} />
              <Stat label="Spare" value={fmtPct(pct(shots.spares, shots.spareChances))} />
              <Stat label="Single pin" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} />
              <Stat label="High game" value={score.highGame} />
              <Stat label="High series" value={league.highSeries} />
              <Stat label="Open frames" value={shots.openFrames} />
            </dl>

            {patternRows && (
              <div>
                <p className="mb-2 text-xs text-muted">By pattern</p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                  {patternRows.map((p) => (
                    <div key={p.key} className="shrink-0 rounded-lg bg-raised px-3 py-2 ring-1 ring-line">
                      <p className="text-xs text-muted">{p.label}</p>
                      <p className="num text-lg font-semibold">
                        {p.score.average ?? '—'} <span className="text-xs font-normal text-muted">· {count(p.score.games, 'game')}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to={`/leagues/${encodeURIComponent(league.key)}`} className={`${textButton} -ml-2`}>
              Open league page
              <Icon name="back" className="ml-1 h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { nights } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { Page, Card } from '../components/ui'

const TYPE_LABEL = { league: 'League', tournament: 'Tournament', practice: 'Practice' } as const

// League night overview: one card per session, newest first.
export function NightsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const rows = useMemo(() => nights(sessions), [sessions])

  return (
    <Page title="Nights" wide>
      {rows.length === 0 && <Card className="p-6 text-muted">No sessions yet. Start one on the Score tab.</Card>}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ session, scores, series, shots }) => {
          const pattern = patterns.find((p) => p.id === session.patternId)
          return (
            <li key={session.id}>
              <Link
                to={`/nights/${session.id}`}
                className="block h-full space-y-3 rounded-xl bg-surface p-4 ring-1 ring-line transition active:bg-raised"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-semibold">{session.eventName ?? TYPE_LABEL[session.type]}</p>
                    <p className="shrink-0 text-xs text-muted">
                      {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    {TYPE_LABEL[session.type]} · {pattern?.name ?? 'House shot'}
                  </p>
                </div>
                <div className="flex items-end gap-4">
                  {scores.map((sc, i) => (
                    <div key={i}>
                      <p className="text-xs text-muted">Game {i + 1}</p>
                      <p className="num text-2xl font-semibold">{sc ?? '…'}</p>
                    </div>
                  ))}
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted">Series</p>
                    <p className="num text-2xl font-semibold text-accent">{series ?? '—'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Strike {fmtPct(pct(shots.strikes, shots.strikeChances)) ?? '—'} · Spare{' '}
                  {fmtPct(pct(shots.spares, shots.spareChances)) ?? '—'} · Opens {shots.openFrames}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}

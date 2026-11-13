import { useMemo } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { nights } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'

const TYPE_LABEL = { league: 'League', tournament: 'Tournament', practice: 'Practice' } as const

// League night overview: one card per session, newest first.
export function NightsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const rows = useMemo(() => nights(sessions), [sessions])

  return (
    <div className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Nights</h1>
      {rows.length === 0 && <p className="text-gray-400">No sessions yet. Start one on the Score tab.</p>}
      <ul className="space-y-3">
        {rows.map(({ session, scores, series, shots }) => {
          const pattern = patterns.find((p) => p.id === session.patternId)
          return (
            <li key={session.id}>
              <Link to={`/nights/${session.id}`} className="block rounded bg-gray-800 p-3 space-y-2 active:bg-gray-700">
              <div className="flex items-baseline justify-between">
                <p className="font-medium">{session.eventName ?? TYPE_LABEL[session.type]}</p>
                <p className="text-xs text-gray-400">
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {TYPE_LABEL[session.type]} · {pattern?.name ?? 'House shot'}
              </p>
              <div className="flex items-end gap-3">
                {scores.map((sc, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-gray-500">G{i + 1}</p>
                    <p className="text-lg font-bold">{sc ?? '…'}</p>
                  </div>
                ))}
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Series</p>
                  <p className="text-lg font-bold">{series ?? '—'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">
                Strike {fmtPct(pct(shots.strikes, shots.strikeChances)) ?? '—'} · Spare{' '}
                {fmtPct(pct(shots.spares, shots.spareChances)) ?? '—'} · Opens {shots.openFrames}
              </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

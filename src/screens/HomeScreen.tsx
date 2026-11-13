import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { summarize, nights, byLeague, byPattern, leagueKey, houseShotSessions } from '../stats/slices'
import { gameScore, pct, fmtPct } from '../stats/stats'
import { sessionsInPeriod, type Period } from '../stats/period'
import { StatTile } from '../components/StatTile'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

// Home: headline stats for the chosen period. All math lives in stats/; this only displays.
export function HomeScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const [period, setPeriod] = useState<Period>('week')

  const inPeriod = useMemo(() => sessionsInPeriod(sessions, period), [sessions, period])
  const leagues = useMemo(() => byLeague(inPeriod), [inPeriod])
  // null = house shot overview; otherwise a leagueKey
  const [league, setLeague] = useState<string | null>(null)
  const selected = useMemo(
    () =>
      league === null
        ? houseShotSessions(inPeriod, patterns)
        : inPeriod.filter((s) => s.type === 'league' && leagueKey(s.eventName) === league),
    [inPeriod, league, patterns],
  )
  const summary = useMemo(() => summarize(selected), [selected])
  // Per-pattern breakdown for leagues bowled on any sport pattern (e.g. Brunswick's rotation)
  const patternsByLeague = useMemo(() => {
    const out = new Map<string, ReturnType<typeof byPattern>>()
    for (const l of leagues) {
      const ls = inPeriod.filter((s) => s.type === 'league' && leagueKey(s.eventName) === l.key)
      if (houseShotSessions(ls, patterns).length === ls.length) continue // all house shot
      out.set(l.key, byPattern(ls, patterns))
    }
    return out
  }, [leagues, inPeriod, patterns])
  // Completed game scores, oldest first, for the trend line
  const trend = useMemo(
    () =>
      [...selected]
        .sort((a, b) => a.date.localeCompare(b.date))
        .flatMap((s) => s.games.map(gameScore))
        .filter((x): x is number => x !== null),
    [selected],
  )
  const recent = useMemo(() => nights(sessions).slice(0, 3), [sessions])

  const { score, shots } = summary

  return (
    <div className="w-full max-w-sm space-y-5">
      <h1 className="text-2xl font-bold">Home</h1>

      <div role="tablist" aria-label="Period" className="grid grid-cols-3 rounded-lg bg-gray-800 p-1">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === period}
            onClick={() => setPeriod(key)}
            className={`rounded-md py-2 text-sm font-medium ${
              key === period ? 'bg-white text-gray-900' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {leagues.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4" aria-label="League">
          {[{ key: null, label: 'House shot' }, ...leagues.map((l) => ({ key: l.key as string | null, label: l.label }))].map((c) => (
            <button
              key={c.key ?? 'all'}
              type="button"
              aria-pressed={league === c.key}
              onClick={() => setLeague(c.key)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                league === c.key ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {score.games === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-gray-400">
          No completed games this {period}.
        </p>
      ) : (
        <>
          <section className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5">
            <p className="text-sm text-indigo-100/80">
              {league === null ? 'House shot average' : `${leagues.find((l) => l.key === league)?.label ?? ''} average`}
            </p>
            <p className="text-5xl font-bold tabular-nums">{score.average}</p>
            <p className="text-xs text-indigo-100/70">{score.games} games</p>
            <Sparkline values={trend} />
          </section>

          <section className="grid grid-cols-2 gap-2">
            <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes}/${shots.strikeChances}`} />
            <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares}/${shots.spareChances}`} />
            <StatTile label="High game" value={score.highGame} />
            <StatTile label="High series" value={summary.highSeries} />
            <StatTile label="Open frames" value={shots.openFrames} sub={`of ${shots.frames}`} />
            <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} />
          </section>
        </>
      )}

      {leagues.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">By league</h2>
          <ul className="space-y-2">
            {leagues.map((l) => (
              <li key={l.key}>
                <Link
                  to={`/leagues/${encodeURIComponent(l.key)}`}
                  className="flex w-full items-center justify-between rounded-lg bg-gray-800 p-3 text-left active:bg-gray-700"
                >
                <div>
                  <p className="font-medium">{l.label}</p>
                  <p className="text-xs text-gray-400">
                    {l.score.games} games · Strike {fmtPct(pct(l.shots.strikes, l.shots.strikeChances)) ?? '—'} · Spare{' '}
                    {fmtPct(pct(l.shots.spares, l.shots.spareChances)) ?? '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{l.score.average ?? '—'}</p>
                  <p className="text-xs text-gray-400">avg ›</p>
                </div>
                </Link>
                {patternsByLeague.get(l.key) && (
                  <ul className="mt-1 space-y-1 pl-3">
                    {patternsByLeague.get(l.key)!.map((p) => (
                      <li key={p.key} className="flex items-center justify-between rounded bg-gray-800/60 px-3 py-2 text-sm">
                        <span>
                          {p.label} <span className="text-xs text-gray-500">· {p.score.games} g</span>
                        </span>
                        <span className="font-semibold tabular-nums">{p.score.average ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Recent nights</h2>
            <Link to="/nights" className="text-xs text-gray-400">See all</Link>
          </div>
          <ul className="divide-y divide-gray-700 rounded-lg bg-gray-800">
            {recent.map(({ session, scores, series }) => (
              <li key={session.id}>
                <Link to={`/nights/${session.id}`} className="flex items-center justify-between p-3 active:bg-gray-700">
                  <div>
                    <p className="font-medium">
                      {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {patterns.find((p) => p.id === session.patternId)?.name ?? 'House shot'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{series ?? '—'}</p>
                    <p className="text-xs tabular-nums text-gray-400">{scores.map((s) => s ?? '…').join(' · ')}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// Dependency-free trend line; needs at least 2 points.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1 // all-equal scores would divide by zero
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 h-12 w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke="white" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

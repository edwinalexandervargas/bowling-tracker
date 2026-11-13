import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { summarize, nights, byLeague, byPattern, leagueKey, houseShotSessions } from '../stats/slices'
import { gameScore, pct, fmtPct } from '../stats/stats'
import { sessionsInPeriod, type Period } from '../stats/period'
import { TrendChart } from '../components/TrendChart'
import { Card, Chips, Metric, SectionTitle, Segmented } from '../components/ui'

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
  const strikePct = pct(shots.strikes, shots.strikeChances)
  const sparePct = pct(shots.spares, shots.spareChances)
  const singlePct = pct(shots.singlePinSpares, shots.singlePinChances)
  const leagueLabel = leagues.find((l) => l.key === league)?.label

  return (
    <div className="w-full max-w-sm space-y-5">
      <header className="flex items-end justify-between pt-2">
        <div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        </div>
      </header>

      <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />

      {leagues.length > 0 && (
        <Chips
          label="League"
          value={league}
          onChange={setLeague}
          options={[{ key: null, label: 'House shot' }, ...leagues.map((l) => ({ key: l.key as string | null, label: l.label }))]}
        />
      )}

      {score.games === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-3xl">🎳</p>
          <p className="mt-2 font-medium">No completed games this {period}</p>
          <p className="text-sm text-gray-400">Bowl a game on the Score tab to see your trend.</p>
        </Card>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-violet-900/40">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <p className="text-sm font-medium text-white/70">{leagueLabel ? `${leagueLabel} average` : 'House shot average'}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tight tabular-nums">{score.average}</span>
              <span className="text-sm text-white/60">{score.games} games</span>
            </div>
            <div className="mt-4">
              <TrendChart values={trend} average={score.average} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Metric label="Strike" value={fmtPct(strikePct)} bar={strikePct} sub={`${shots.strikes} of ${shots.strikeChances}`} />
            <Metric label="Spare" value={fmtPct(sparePct)} bar={sparePct} sub={`${shots.spares} of ${shots.spareChances}`} />
            <Metric label="Single pin" value={fmtPct(singlePct)} bar={singlePct} />
            <Metric label="Open frames" value={shots.openFrames} sub={`of ${shots.frames}`} />
            <Metric label="High game" value={score.highGame} />
            <Metric label="High series" value={summary.highSeries} />
          </section>
        </>
      )}

      {leagues.length > 0 && (
        <section>
          <SectionTitle>Leagues</SectionTitle>
          <div className="space-y-2">
            {leagues.map((l) => (
              <Card key={l.key} className="overflow-hidden">
                <Link to={`/leagues/${encodeURIComponent(l.key)}`} className="flex items-center gap-3 p-4 transition active:bg-white/5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold">
                    {l.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{l.label}</p>
                    <p className="text-xs text-gray-400">
                      {l.score.games} games · {fmtPct(pct(l.shots.strikes, l.shots.strikeChances)) ?? '—'} strikes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{l.score.average ?? '—'}</p>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">avg</p>
                  </div>
                  <span className="text-gray-500" aria-hidden="true">›</span>
                </Link>
                {patternsByLeague.get(l.key) && (
                  <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-3 [scrollbar-width:none]">
                    {patternsByLeague.get(l.key)!.map((p) => (
                      <div key={p.key} className="shrink-0 rounded-xl bg-white/5 px-3 py-2">
                        <p className="text-[11px] text-gray-400">{p.label}</p>
                        <p className="font-semibold tabular-nums">
                          {p.score.average ?? '—'} <span className="text-xs font-normal text-gray-500">· {p.score.games}g</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionTitle action={<Link to="/nights" className="text-xs font-medium text-indigo-300">See all</Link>}>
            Recent nights
          </SectionTitle>
          <Card className="divide-y divide-white/5">
            {recent.map(({ session, scores, series }) => (
              <Link key={session.id} to={`/nights/${session.id}`} className="flex items-center justify-between p-4 transition active:bg-white/5">
                <div>
                  <p className="font-medium">
                    {session.eventName ?? 'Practice'}{' '}
                    <span className="text-gray-500">
                      · {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {patterns.find((p) => p.id === session.patternId)?.name ?? 'House shot'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums">{series ?? '—'}</p>
                  <p className="text-xs tabular-nums text-gray-500">{scores.map((s) => s ?? '…').join(' · ')}</p>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

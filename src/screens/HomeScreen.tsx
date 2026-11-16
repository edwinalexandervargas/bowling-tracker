import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { summarize, nights, byLeague, byPattern, leagueKey, houseShotSessions } from '../stats/slices'
import { gameScore, pct, fmtPct } from '../stats/stats'
import { sessionsInPeriod, type Period } from '../stats/period'
import { count } from '../format'
import { TrendChart } from '../components/TrendChart'
import { Card, Chips, Metric, PinRack, SectionTitle, Segmented } from '../components/ui'
import { Icon } from '../components/Icon'
import { textButton } from '../components/styles'

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
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="display text-2xl">Overview</h1>
      </header>

      <div className="max-w-md">
        <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {leagues.length > 0 && (
        <Chips
          label="League"
          value={league}
          onChange={setLeague}
          options={[{ key: null, label: 'House shot' }, ...leagues.map((l) => ({ key: l.key as string | null, label: l.label }))]}
        />
      )}

      {/* One column on phones and tablets. From 1024px the numbers sit on the left and the lists on the right. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
      <div className="space-y-5">
      {score.games === 0 ? (
        <Card className="p-8 text-center">
          <PinRack className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">No completed games this {period}</p>
          <p className="text-sm text-muted">Bowl a game on the Score tab to see your trend.</p>
        </Card>
      ) : (
        <>
          <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <p className="text-sm font-medium text-muted">{leagueLabel ? `${leagueLabel} average` : 'House shot average'}</p>
            <div className="flex items-baseline gap-2">
              <span className="num text-7xl font-semibold text-accent">{score.average}</span>
              <span className="text-sm text-muted">{count(score.games, 'game')}</span>
            </div>
            <div className="mt-4">
              <TrendChart values={trend} average={score.average} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Strike" value={fmtPct(strikePct)} bar={strikePct} sub={`${shots.strikes} of ${shots.strikeChances}`} />
            <Metric label="Spare" value={fmtPct(sparePct)} bar={sparePct} sub={`${shots.spares} of ${shots.spareChances}`} />
            <Metric label="Single pin" value={fmtPct(singlePct)} bar={singlePct} />
            <Metric label="Open frames" value={shots.openFrames} sub={`of ${shots.frames}`} />
            <Metric label="High game" value={score.highGame} />
            <Metric label="High series" value={summary.highSeries} />
          </section>
        </>
      )}
      </div>

      <div className="space-y-5">
      {leagues.length > 0 && (
        <section>
          <SectionTitle>Leagues</SectionTitle>
          <div className="space-y-2">
            {leagues.map((l) => (
              <Card key={l.key} className="overflow-hidden">
                <Link to={`/leagues/${encodeURIComponent(l.key)}`} className="flex items-center gap-3 p-4 transition active:bg-raised">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-raised text-sm font-semibold text-accent ring-1 ring-line">
                    {l.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{l.label}</p>
                    <p className="text-xs text-muted">
                      {count(l.score.games, 'game')} · {fmtPct(pct(l.shots.strikes, l.shots.strikeChances)) ?? '—'} strikes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-3xl font-semibold">{l.score.average ?? '—'}</p>
                    <p className="text-xs text-muted">average</p>
                  </div>
                  <Icon name="back" className="h-4 w-4 rotate-180 text-muted" />
                </Link>
                {patternsByLeague.get(l.key) && (
                  <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 [scrollbar-width:none]">
                    {patternsByLeague.get(l.key)!.map((p) => (
                      <div key={p.key} className="shrink-0 rounded-xl bg-raised px-3 py-2">
                        <p className="text-[11px] text-muted">{p.label}</p>
                        <p className="num text-lg font-semibold">
                          {p.score.average ?? '—'} <span className="text-xs font-normal text-muted">· {p.score.games}g</span>
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
          <SectionTitle action={<Link to="/nights" className={textButton}>See all</Link>}>
            Recent nights
          </SectionTitle>
          <Card className="divide-y divide-line">
            {recent.map(({ session, scores, series }) => (
              <Link key={session.id} to={`/nights/${session.id}`} className="flex items-center justify-between p-4 transition active:bg-raised">
                <div>
                  <p className="font-medium">
                    {session.eventName ?? 'Practice'}{' '}
                    <span className="text-muted">
                      · {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {patterns.find((p) => p.id === session.patternId)?.name ?? 'House shot'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-2xl font-semibold">{series ?? '—'}</p>
                  <p className="num text-sm text-muted">{scores.map((s) => s ?? '…').join(' · ')}</p>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}
      </div>
      </div>
    </div>
  )
}

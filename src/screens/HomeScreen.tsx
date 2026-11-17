import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { summarize, nights, byLeague, byPattern, leagueKey, houseShotSessions } from '../stats/slices'
import { gameScore, pct, fmtPct } from '../stats/stats'
import { sessionsInPeriod, type Period } from '../stats/period'
import { count } from '../format'
import { TrendChart } from '../components/TrendChart'
import { LeagueCard } from '../components/LeagueCard'
import { Card, Chips, Metric, PinRack, SectionTitle, Segmented } from '../components/ui'
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
  // The league pill that was tapped, if any
  const [pickedLeague, setPickedLeague] = useState<string | null>(null)
  // The league on show: the one tapped, else the league with the most games.
  // null only when there are no league nights at all.
  const league = leagues.some((l) => l.key === pickedLeague) ? pickedLeague : (leagues[0]?.key ?? null)
  // Which league card is dropped open in the Leagues list (none to start)
  const [openLeague, setOpenLeague] = useState<string | null>(null)
  const selected = useMemo(
    () =>
      // With no leagues yet, the numbers cover everything bowled in the period
      league === null
        ? inPeriod
        : inPeriod.filter((s) => s.type === 'league' && leagueKey(s.eventName) === league),
    [inPeriod, league],
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
          onChange={setPickedLeague}
          options={leagues.map((l) => ({ key: l.key, label: l.label }))}
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
            <p className="text-sm font-medium text-muted">{leagueLabel ? `${leagueLabel} average` : 'Average'}</p>
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
              <LeagueCard
                key={l.key}
                league={l}
                patternRows={patternsByLeague.get(l.key)}
                open={openLeague === l.key}
                // Opening one closes the other; tapping the open one closes it
                onToggle={() => setOpenLeague((current) => (current === l.key ? null : l.key))}
              />
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

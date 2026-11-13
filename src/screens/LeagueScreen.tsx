import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { leagueSeasons, leagueKey, summarize, byPattern, houseShotSessions, nights } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { TrendChart } from '../components/TrendChart'
import { Card, Chips, Metric, SectionTitle } from '../components/ui'
import { gameScore } from '../stats/stats'

// One league: pick a season, see its stats, per-pattern averages and every night's scores.
export function LeagueScreen() {
  const { leagueKey: key = '' } = useParams()
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const closes = useGameStore((s) => s.seasonCloses)
  const closeSeason = useGameStore((s) => s.closeSeason)
  const undoCloseSeason = useGameStore((s) => s.undoCloseSeason)

  const seasons = useMemo(() => leagueSeasons(sessions, closes, key), [sessions, closes, key])
  const [seasonId, setSeasonId] = useState('current')
  const [confirming, setConfirming] = useState(false)
  // leagueSeasons always returns the open season, so [0] exists
  const season = seasons.find((s) => s.id === seasonId) ?? seasons[0]!

  const name = sessions.find((s) => s.type === 'league' && leagueKey(s.eventName) === key)?.eventName?.trim() ?? key
  const summary = useMemo(() => summarize(season.sessions), [season])
  const isSport = houseShotSessions(season.sessions, patterns).length < season.sessions.length
  const patternRows = useMemo(() => (isSport ? byPattern(season.sessions, patterns) : []), [isSport, season, patterns])
  const rows = useMemo(() => nights(season.sessions), [season])
  const { score, shots } = summary
  const trend = season.sessions.flatMap((s) => s.games.map(gameScore)).filter((x): x is number => x !== null)
  const isCurrent = season.closedAt === null
  const hasClosed = seasons.length > 1

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <Link to="/" className="text-sm text-indigo-300">‹ Overview</Link>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{name}</h1>
        <p className="text-sm text-gray-400">{season.label}</p>
      </div>

      {hasClosed && (
        <Chips label="Season" value={season.id} options={seasons.map((x) => ({ key: x.id, label: x.label }))}
          onChange={(id) => { setSeasonId(id); setConfirming(false) }} />
      )}

      {season.sessions.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">No nights bowled this season yet.</Card>
      ) : (
        <>
          <section className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-violet-900/40">
            <p className="text-sm font-medium text-white/70">Season average</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tight tabular-nums">{score.average ?? '—'}</span>
              <span className="text-sm text-white/60">{score.games} games · {summary.sessions} weeks</span>
            </div>
            <div className="mt-4"><TrendChart values={trend} average={score.average} /></div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Metric label="Strike" value={fmtPct(pct(shots.strikes, shots.strikeChances))} bar={pct(shots.strikes, shots.strikeChances)} />
            <Metric label="Spare" value={fmtPct(pct(shots.spares, shots.spareChances))} bar={pct(shots.spares, shots.spareChances)} />
            <Metric label="High game" value={score.highGame} />
            <Metric label="High series" value={summary.highSeries} />
          </section>

          {patternRows.length > 0 && (
            <section>
              <SectionTitle>By pattern</SectionTitle>
              <ul className="grid grid-cols-2 gap-2">
                {patternRows.map((p) => (
                  <li key={p.key}>
                    <Card className="p-3">
                      <p className="truncate text-xs text-gray-400">{p.label}</p>
                      <p className="text-xl font-semibold tabular-nums">{p.score.average ?? '—'}</p>
                      <p className="text-xs text-gray-500">{p.score.games} games</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle>Weekly scores</SectionTitle>
            <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
              {rows.map(({ session, scores, series }, i) => (
                <li key={session.id}>
                  <Link to={`/nights/${session.id}`} className="flex items-center justify-between p-4 transition active:bg-white/5">
                    <div>
                      <p className="font-medium">
                        Wk {rows.length - i} · {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
        </>
      )}

      {isCurrent && season.sessions.length > 0 && (
        confirming ? (
          <div className="space-y-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <p className="text-sm">Close this season? Nights after today start a new season. You can undo this.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { closeSeason(key); setConfirming(false) }}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-medium">Close season</button>
              <button type="button" onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className="w-full rounded-2xl py-3 text-sm font-medium text-gray-300 ring-1 ring-white/10 transition active:bg-white/5">
            Close out season
          </button>
        )
      )}

      {season.id === seasons[1]?.id && (
        <button type="button" onClick={() => { undoCloseSeason(key); setSeasonId('current') }}
          className="w-full text-center text-xs text-gray-500 underline">
          Reopen this season
        </button>
      )}
    </div>
  )
}

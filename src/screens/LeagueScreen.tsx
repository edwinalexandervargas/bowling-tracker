import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { leagueSeasons, leagueKey, summarize, byPattern, houseShotSessions, nights } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { StatTile } from '../components/StatTile'

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
  const isCurrent = season.closedAt === null
  const hasClosed = seasons.length > 1

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <Link to="/" className="text-sm text-gray-400">‹ Home</Link>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>

      {hasClosed && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Season">
          {seasons.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === season.id}
              onClick={() => { setSeasonId(s.id); setConfirming(false) }}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                s.id === season.id ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {season.sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-gray-400">
          No nights bowled this season yet.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-2">
            <StatTile label="Average" value={score.average} sub={`${score.games} games`} />
            <StatTile label="High game" value={score.highGame} />
            <StatTile label="High series" value={summary.highSeries} />
            <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} />
            <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} />
            <StatTile label="Weeks" value={summary.sessions} />
          </section>

          {patternRows.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">By pattern</h2>
              <ul className="space-y-1">
                {patternRows.map((p) => (
                  <li key={p.key} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2 text-sm">
                    <span>{p.label} <span className="text-xs text-gray-500">· {p.score.games} g</span></span>
                    <span className="font-semibold tabular-nums">{p.score.average ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Weekly scores</h2>
            <ul className="divide-y divide-gray-700 rounded-lg bg-gray-800">
              {rows.map(({ session, scores, series }, i) => (
                <li key={session.id}>
                  <Link to={`/nights/${session.id}`} className="flex items-center justify-between p-3 active:bg-gray-700">
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
          <div className="space-y-2 rounded-lg bg-gray-800 p-3">
            <p className="text-sm">Close this season? Nights after today start a new season. You can undo this.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { closeSeason(key); setConfirming(false) }}
                className="flex-1 rounded bg-indigo-500 py-2 text-sm font-medium">Close season</button>
              <button type="button" onClick={() => setConfirming(false)}
                className="flex-1 rounded bg-gray-700 py-2 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-300">
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

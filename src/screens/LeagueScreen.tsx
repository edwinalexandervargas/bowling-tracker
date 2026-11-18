import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { blockedForGuest } from '../guest/guestStore'
import { leagueSeasons, leagueKey, summarize, byPattern, houseShotSessions, nights } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { TrendChart } from '../components/TrendChart'
import { Card, Chips, Metric, SectionTitle } from '../components/ui'
import { Icon } from '../components/Icon'
import { primaryButton, secondaryButton, quietTextButton } from '../components/styles'
import { gameScore } from '../stats/stats'
import { count } from '../format'

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
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <Link to="/" className="-ml-2 inline-flex min-h-tap items-center gap-1 px-2 text-sm font-medium text-accent">
          <Icon name="back" className="h-4 w-4" />
          Overview
        </Link>
        <h1 className="display text-2xl">{name}</h1>
        <p className="text-sm text-muted">{season.label}</p>
      </header>

      {hasClosed && (
        <Chips label="Season" value={season.id} options={seasons.map((x) => ({ key: x.id, label: x.label }))}
          onChange={(id) => { setSeasonId(id); setConfirming(false) }} />
      )}

      {season.sessions.length === 0 ? (
        <Card className="p-8 text-center text-muted">No nights bowled this season yet.</Card>
      ) : (
        // One column up to 1024px, then numbers on the left and the weekly list on the right.
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
          <div className="space-y-5">
          <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <p className="text-sm font-medium text-muted">Season average</p>
            <div className="flex items-baseline gap-2">
              <span className="num text-7xl font-semibold text-accent">{score.average ?? '—'}</span>
              <span className="text-sm text-muted">{count(score.games, 'game')} · {count(summary.sessions, 'week')}</span>
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
                      <p className="truncate text-xs text-muted">{p.label}</p>
                      <p className="num text-2xl font-semibold">{p.score.average ?? '—'}</p>
                      <p className="text-xs text-muted">{count(p.score.games, 'game')}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          </div>

          <section>
            <SectionTitle>Weekly scores</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
              {rows.map(({ session, scores, series }, i) => (
                <li key={session.id}>
                  <Link to={`/nights/${session.id}`} className="flex items-center justify-between p-4 transition active:bg-raised">
                    <div>
                      <p className="font-medium">
                        Week {rows.length - i} · {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {isCurrent && season.sessions.length > 0 && (
        confirming ? (
          <div className="max-w-md space-y-3 rounded-xl bg-surface p-4 ring-1 ring-line">
            <p className="text-sm">Close this season? Nights after today start a new season. You can undo this.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { if (blockedForGuest()) return; closeSeason(key); setConfirming(false) }}
                className={`${primaryButton} flex-1`}>Close season</button>
              <button type="button" onClick={() => setConfirming(false)}
                className={`${secondaryButton} flex-1`}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className={`${secondaryButton} w-full max-w-md`}>
            Close out season
          </button>
        )
      )}

      {season.id === seasons[1]?.id && (
        <button type="button" onClick={() => { if (blockedForGuest()) return; undoCloseSeason(key); setSeasonId('current') }}
          className={quietTextButton}>
          Reopen this season
        </button>
      )}
    </div>
  )
}

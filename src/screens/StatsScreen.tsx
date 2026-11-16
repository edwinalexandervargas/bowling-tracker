import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { summarize, byPattern } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { count } from '../format'
import { StatTile } from '../components/StatTile'
import { Page, Card, SectionTitle } from '../components/ui'

export function StatsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)

  // Stats are derived at render from the stored shots (pure functions, memoized).
  const overall = useMemo(() => summarize(sessions), [sessions])
  const patternRows = useMemo(() => byPattern(sessions, patterns), [sessions, patterns])

  const { score, shots } = overall

  if (shots.strikeChances === 0) {
    return (
      <Page title="Stats" wide>
        <Card className="p-6 text-muted">No shots recorded yet. Bowl a game on the Score tab.</Card>
      </Page>
    )
  }

  return (
    <Page title="Stats" wide>
      <section className="grid grid-cols-3 gap-2 xl:grid-cols-9">
        <StatTile label="Average" value={score.average} sub={count(score.games, 'game')} />
        <StatTile label="High game" value={score.highGame} />
        <StatTile label="High series" value={overall.highSeries} />
        <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes}/${shots.strikeChances}`} />
        <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares}/${shots.spareChances}`} />
        <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} sub={`${shots.singlePinSpares}/${shots.singlePinChances}`} />
        <StatTile label="Open frames" value={shots.openFrames} sub={`of ${shots.frames}`} />
        <StatTile label="Splits" value={shots.splits} sub={`${shots.splitsConverted} made`} />
        <StatTile label="Sessions" value={overall.sessions} />
      </section>

      <section>
        <SectionTitle>By pattern</SectionTitle>
        <Card className="overflow-x-auto px-4 py-2">
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 text-left font-normal">Pattern</th>
                <th scope="col" className="py-2 text-right font-normal">Games</th>
                <th scope="col" className="py-2 text-right font-normal">Avg</th>
                <th scope="col" className="py-2 text-right font-normal">Strike</th>
                <th scope="col" className="py-2 text-right font-normal">Spare</th>
              </tr>
            </thead>
            <tbody className="num text-base">
              {patternRows.map((r) => (
                <tr key={r.key} className="border-t border-line text-right">
                  <th scope="row" className="py-2.5 pr-2 text-left font-sans text-sm font-medium [font-stretch:100%]">{r.label}</th>
                  <td>{r.score.games}</td>
                  <td>{r.score.average ?? '—'}</td>
                  <td>{fmtPct(pct(r.shots.strikes, r.shots.strikeChances)) ?? '—'}</td>
                  <td>{fmtPct(pct(r.shots.spares, r.shots.spareChances)) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </Page>
  )
}

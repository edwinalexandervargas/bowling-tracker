import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { summarize, byPattern } from '../stats/slices'
import { pct, fmtPct } from '../stats/stats'
import { count } from '../format'
import { StatTile } from '../components/StatTile'
import { Page, Card, SectionTitle } from '../components/ui'
import { useGuestStore } from '../guest/guestStore'
import { visitStats } from '../guest/visitStats'
import { leaveName } from '../pins/leaves'

// Guest mode only: the numbers from the games bowled this visit. The rest of
// the screen includes the sample nights, which this leaves out.
function VisitSection() {
  const sessions = useGameStore((s) => s.sessions)
  const visit = useMemo(() => visitStats(sessions), [sessions])
  const { shots } = visit

  return (
    <section aria-labelledby="visit-title">
      <SectionTitle><span id="visit-title">Your games this visit</span></SectionTitle>
      {shots.strikeChances === 0 ? (
        <Card className="p-4 text-sm text-muted">Bowl a game on the Score tab and your numbers show here. The stats below include two sample nights.</Card>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes} of ${shots.strikeChances}`} />
            <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares} of ${shots.spareChances}`} />
            <StatTile label="Games" value={visit.score.games} sub={visit.score.average !== null ? `${visit.score.average} average` : 'none finished yet'} />
          </div>
          {visit.leaves.length > 0 && (
            <Card className="px-4 py-2">
              <table className="w-full text-sm">
                <caption className="py-2 text-left text-muted">Most common leaves</caption>
                <thead className="sr-only">
                  <tr><th scope="col">Leave</th><th scope="col">Made</th></tr>
                </thead>
                <tbody className="num text-base">
                  {visit.leaves.map((l) => (
                    <tr key={l.leave} className="border-t border-line">
                      <th scope="row" className="py-2 text-left font-medium">{leaveName(l.leave)}</th>
                      <td className="py-2 text-right">{l.converted} of {l.attempts} made</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <p className="text-xs text-muted">The stats below include two sample nights.</p>
        </div>
      )}
    </section>
  )
}

export function StatsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const guest = useGuestStore((s) => s.active)

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
      {guest && <VisitSection />}
      <section className="grid grid-cols-3 gap-2 xl:grid-cols-9">
        <StatTile label="Average" value={score.average} sub={count(score.games, 'game')} />
        <StatTile label="High game" value={score.highGame} />
        <StatTile label="High series" value={overall.highSeries} />
        <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes} of ${shots.strikeChances}`} />
        <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares} of ${shots.spareChances}`} />
        <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} sub={`${shots.singlePinSpares} of ${shots.singlePinChances}`} />
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
                <th scope="col" className="py-2 text-right font-normal">Average</th>
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

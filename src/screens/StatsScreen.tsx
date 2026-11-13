import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { summarize, byPattern, byBall } from '../stats/slices'
import { leaveStats, pct, fmtPct } from '../stats/stats'
import { isSplit, leaveName } from '../pins/leaves'
import { ballName } from '../arsenal/ballLabel'
import { StatTile } from '../components/StatTile'

export function StatsScreen() {
  const sessions = useGameStore((s) => s.sessions)
  const patterns = useGameStore((s) => s.patterns)
  const balls = useGameStore((s) => s.balls)
  const ballSpecs = useGameStore((s) => s.ballSpecs)

  // Stats are derived at render from the stored shots (pure functions, memoized).
  const overall = useMemo(() => summarize(sessions), [sessions])
  const patternRows = useMemo(() => byPattern(sessions, patterns), [sessions, patterns])
  const ballRows = useMemo(() => byBall(sessions), [sessions])
  const leaves = useMemo(
    () => leaveStats(sessions.flatMap((s) => s.games.flatMap((g) => g.frames))),
    [sessions],
  )

  const { score, shots } = overall

  if (shots.strikeChances === 0) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-gray-400">No shots recorded yet. Bowl a game on the Score tab.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Stats</h1>

      <section className="grid grid-cols-3 gap-2">
        <StatTile label="Average" value={score.average} sub={`${score.games} games`} />
        <StatTile label="High game" value={score.highGame} />
        <StatTile label="High series" value={overall.highSeries} />
        <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes}/${shots.strikeChances}`} />
        <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares}/${shots.spareChances}`} />
        <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} sub={`${shots.singlePinSpares}/${shots.singlePinChances}`} />
        <StatTile label="Open frames" value={shots.openFrames} sub={`of ${shots.frames}`} />
        <StatTile label="Splits" value={shots.splits} sub={`${shots.splitsConverted} made`} />
        <StatTile label="Sessions" value={overall.sessions} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">By pattern</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr><th className="text-left font-normal">Pattern</th><th className="font-normal">G</th><th className="font-normal">Avg</th><th className="font-normal">Strike</th><th className="font-normal">Spare</th></tr>
          </thead>
          <tbody>
            {patternRows.map((r) => (
              <tr key={r.key} className="border-t border-gray-800 text-center">
                <td className="py-1 text-left">{r.label}</td>
                <td>{r.score.games}</td>
                <td>{r.score.average ?? '—'}</td>
                <td>{fmtPct(pct(r.shots.strikes, r.shots.strikeChances)) ?? '—'}</td>
                <td>{fmtPct(pct(r.shots.spares, r.shots.spareChances)) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">By ball</h2>
        {ballRows.length === 0 ? (
          <p className="text-sm text-gray-400">Pick a ball during score entry to see per-ball stats.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr><th className="text-left font-normal">Ball</th><th className="font-normal">Racks</th><th className="font-normal">Strike</th><th className="font-normal">Spare</th></tr>
            </thead>
            <tbody>
              {ballRows.map((r) => (
                <tr key={r.ballId} className="border-t border-gray-800 text-center">
                  <td className="py-1 text-left">{ballName(balls.find((b) => b.id === r.ballId), ballSpecs)}</td>
                  <td>{r.shots.strikeChances}</td>
                  <td>{fmtPct(pct(r.shots.strikes, r.shots.strikeChances)) ?? '—'}</td>
                  <td>{fmtPct(pct(r.shots.spares, r.shots.spareChances)) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Leaves</h2>
        {leaves.length === 0 ? (
          <p className="text-sm text-gray-400">No leaves yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr><th className="text-left font-normal">Leave</th><th className="font-normal">Left</th><th className="font-normal">Made</th><th className="font-normal">%</th></tr>
            </thead>
            <tbody>
              {leaves.slice(0, 15).map((l) => (
                <tr key={l.leave} className="border-t border-gray-800 text-center">
                  <td className="py-1 text-left">
                    {leaveName(l.leave)}
                    {isSplit(l.leave) && <span className="ml-2 text-xs text-red-400">split</span>}
                  </td>
                  <td>{l.attempts}</td>
                  <td>{l.converted}</td>
                  <td>{fmtPct(pct(l.converted, l.attempts))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

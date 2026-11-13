import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { Scoresheet } from '../components/Scoresheet'
import { StatTile } from '../components/StatTile'
import { gameScore, leaveStats, pct, fmtPct, shotStats } from '../stats/stats'
import { isSplit, leaveName } from '../pins/leaves'

const TYPE_LABEL = { league: 'League', tournament: 'Tournament', practice: 'Practice' } as const

// One night: every game's scoresheet with leaves under each frame, plus the night's stats.
export function NightDetailScreen() {
  const { sessionId } = useParams()
  const session = useGameStore((s) => s.sessions.find((x) => x.id === sessionId))
  const patterns = useGameStore((s) => s.patterns)

  const frames = useMemo(() => session?.games.flatMap((g) => g.frames) ?? [], [session])
  const shots = useMemo(() => shotStats(frames), [frames])
  const leaves = useMemo(() => leaveStats(frames), [frames])

  if (!session) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <p className="text-gray-400">That night doesn't exist anymore.</p>
        <Link to="/nights" className="text-blue-400 underline">Back to nights</Link>
      </div>
    )
  }

  const scores = session.games.map(gameScore)
  const done = scores.filter((x): x is number => x !== null)
  const series = done.length ? done.reduce((a, b) => a + b, 0) : null
  const pattern = patterns.find((p) => p.id === session.patternId)

  return (
    <div className="w-full max-w-md space-y-5">
      <Link to="/nights" className="text-sm text-blue-400">← Nights</Link>

      <header>
        <h1 className="text-2xl font-bold">{session.eventName ?? TYPE_LABEL[session.type]}</h1>
        <p className="text-sm text-gray-400">
          {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}{TYPE_LABEL[session.type]} · {pattern?.name ?? 'House shot'}
        </p>
      </header>

      {session.games.length === 0 && <p className="text-gray-400">No games bowled.</p>}

      {session.games.map((game, i) => (
        <section key={game.id} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Game {i + 1}</span>
            <span className="font-bold">{scores[i] ?? 'In progress'}</span>
          </div>
          <Scoresheet game={game} currentFrame={-1} showLeaves />
        </section>
      ))}

      <section className="grid grid-cols-3 gap-2">
        <StatTile label="Series" value={series} sub={`${done.length} games`} />
        <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes}/${shots.strikeChances}`} />
        <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares}/${shots.spareChances}`} />
        <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} />
        <StatTile label="Opens" value={shots.openFrames} />
        <StatTile label="Splits" value={shots.splits} sub={`${shots.splitsConverted} made`} />
      </section>

      {leaves.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Leaves tonight</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr><th className="text-left font-normal">Leave</th><th className="font-normal">Left</th><th className="font-normal">Made</th></tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.leave} className="border-t border-gray-800 text-center">
                  <td className="py-1 text-left">
                    {leaveName(l.leave)}
                    {isSplit(l.leave) && <span className="ml-2 text-xs text-red-400">split</span>}
                  </td>
                  <td>{l.attempts}</td>
                  <td>{l.converted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

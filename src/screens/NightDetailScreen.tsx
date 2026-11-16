import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { Scoresheet } from '../components/Scoresheet'
import { StatTile } from '../components/StatTile'
import { Page, Card } from '../components/ui'
import { gameScore, pct, fmtPct, shotStats } from '../stats/stats'
import { count } from '../format'

const TYPE_LABEL = { league: 'League', tournament: 'Tournament', practice: 'Practice' } as const
const BACK = { to: '/nights', label: 'Nights' }

// One night: every game's scoresheet with leaves under each frame, plus the night's stats.
export function NightDetailScreen() {
  const { sessionId } = useParams()
  const session = useGameStore((s) => s.sessions.find((x) => x.id === sessionId))
  const patterns = useGameStore((s) => s.patterns)

  const frames = useMemo(() => session?.games.flatMap((g) => g.frames) ?? [], [session])
  const shots = useMemo(() => shotStats(frames), [frames])

  if (!session) {
    return (
      <Page title="Night not found" back={BACK}>
        <Card className="p-6 text-muted">That night doesn't exist anymore.</Card>
      </Page>
    )
  }

  const scores = session.games.map(gameScore)
  const done = scores.filter((x): x is number => x !== null)
  const series = done.length ? done.reduce((a, b) => a + b, 0) : null
  const pattern = patterns.find((p) => p.id === session.patternId)

  return (
    <Page title={session.eventName ?? TYPE_LABEL[session.type]} back={BACK} wide>
      <p className="-mt-3 text-sm text-muted">
        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        {' · '}{TYPE_LABEL[session.type]} · {pattern?.name ?? 'House shot'}
      </p>

      {session.games.length === 0 && <Card className="p-6 text-muted">No games bowled.</Card>}

      {session.games.map((game, i) => (
        <section key={game.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-muted">Game {i + 1}</h2>
            {scores[i] === null
              ? <span className="text-sm text-muted">In progress</span>
              : <span className="num text-xl font-semibold">{scores[i]}</span>}
          </div>
          <Scoresheet game={game} currentFrame={-1} showLeaves />
        </section>
      ))}

      <section className="grid grid-cols-3 gap-2 md:grid-cols-6">
        <StatTile label="Series" value={series} sub={count(done.length, 'game')} />
        <StatTile label="Strike %" value={fmtPct(pct(shots.strikes, shots.strikeChances))} sub={`${shots.strikes} of ${shots.strikeChances}`} />
        <StatTile label="Spare %" value={fmtPct(pct(shots.spares, shots.spareChances))} sub={`${shots.spares} of ${shots.spareChances}`} />
        <StatTile label="Single pin %" value={fmtPct(pct(shots.singlePinSpares, shots.singlePinChances))} />
        <StatTile label="Opens" value={shots.openFrames} />
        <StatTile label="Splits" value={shots.splits} sub={`${shots.splitsConverted} made`} />
      </section>
    </Page>
  )
}

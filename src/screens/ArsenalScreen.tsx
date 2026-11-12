import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { formatLayout } from '../arsenal/formatLayout'

export function ArsenalScreen() {
  const balls = useGameStore((s) => s.balls)
  const ballSpecs = useGameStore((s) => s.ballSpecs)

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Arsenal</h1>
        <Link to="/arsenal/new" className="rounded bg-blue-600 px-3 py-1 text-sm font-medium">
          + Add ball
        </Link>
      </div>

      {balls.length === 0 ? (
        <p className="text-gray-400">No balls yet.</p>
      ) : (
        <ul className="space-y-2">
          {balls.map((ball) => {
            const spec = ballSpecs.find((s) => s.id === ball.specId)
            return (
              <li key={ball.id} className="rounded bg-gray-800 p-3">
                <p className="font-medium">
                  {ball.nickname ?? spec?.name ?? 'Unknown ball'}
                  <span className="ml-2 text-sm text-gray-400">{spec?.brand}</span>
                </p>
                <p className="text-sm text-gray-300">
                  {ball.layout.system === '2ls' ? '2LS' : 'Dual angle'} {formatLayout(ball.layout)}
                </p>
                <p className="text-sm text-gray-400">
                  {ball.surface}
                  {ball.weight ? ` · ${ball.weight} lb` : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

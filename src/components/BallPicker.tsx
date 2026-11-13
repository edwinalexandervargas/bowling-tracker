import { ballName } from '../arsenal/ballLabel'
import { Link } from 'react-router'
import type { Ball, BallSpec } from '../types'
import { formatLayout } from '../arsenal/formatLayout'

type Props = {
  balls: Ball[]
  ballSpecs: BallSpec[]
  currentBallId?: string
  onChange: (ballId: string) => void
}

// Presentational: knows nothing about the store. ScoreEntry passes data and the callback in.
export function BallPicker({ balls, ballSpecs, currentBallId, onChange }: Props) {
  if (balls.length === 0) {
    return (
      <Link to="/arsenal/new" className="text-sm text-blue-400 underline">
        Add a ball to track which one you throw
      </Link>
    )
  }

  const label = (ball: Ball) => {
    return `${ballName(ball, ballSpecs)} · ${formatLayout(ball.layout)}`
  }

  return (
    <label className="flex w-full max-w-sm items-center gap-2">
      <span className="text-sm text-gray-400">Ball</span>
      <select
        value={currentBallId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded bg-gray-800 px-3 py-2 text-white"
      >
        {!currentBallId && <option value="">Pick a ball…</option>}
        {balls.map((ball) => (
          <option key={ball.id} value={ball.id}>
            {label(ball)}
          </option>
        ))}
      </select>
    </label>
  )
}

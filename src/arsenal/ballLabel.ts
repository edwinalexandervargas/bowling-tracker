import type { Ball, BallSpec } from '../types'

// "Phase II #2", falling back to the spec name, then "Unknown ball".
export function ballName(ball: Ball | undefined, specs: BallSpec[]): string {
  if (!ball) return 'Unknown ball'
  return ball.nickname ?? specs.find((s) => s.id === ball.specId)?.name ?? 'Unknown ball'
}

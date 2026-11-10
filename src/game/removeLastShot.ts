import type { Game } from '../types'

// Undo: drop the most recent shot. Never mutates the input.
export function removeLastShot(game: Game): Game {
  // 1. Nothing to undo
  if (game.frames.length === 0) return game

  const lastIndex = game.frames.length - 1
  const frame = game.frames[lastIndex]

  // 2. New shots array without the last shot (slice copies, never mutates)
  const newShots = frame.shots.slice(0, -1)

  // 3. Frame now empty → drop the whole frame
  if (newShots.length === 0) {
    return { ...game, frames: game.frames.slice(0, lastIndex) }
  }

  // 4. Otherwise replace the last frame with a copy holding fewer shots
  return {
    ...game,
    frames: [...game.frames.slice(0, lastIndex), { ...frame, shots: newShots }],
  }
}
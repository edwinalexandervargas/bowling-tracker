import type { Game } from '../types'
import { pinsKnockedDown } from '../pins/pins'

// Converts a Game (frames of shot masks) into the flat
// pins-knocked-down list that frameScores() expects.
export function gameToRolls(game: Game): number[] {
  const rolls: number[] = []

  for (let i = 0; i < game.frames.length; i++) {
    const frame = game.frames[i]
    for (let j = 0; j < frame.shots.length; j++) {
      const shot = frame.shots[j]
      rolls.push(pinsKnockedDown(shot.pinsBefore, shot.pinsAfter))
    }
  }

  return rolls
}